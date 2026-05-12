import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import pg from "pg";
import { execFile } from "node:child_process";
import { writeFile, readFile, unlink, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";

const MAX_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 5_000;
const IDLE_SHUTDOWN_MS = 60_000;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "auto",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});
const bucket = process.env.S3_BUCKET ?? "riffsync";

let idleTimer = null;
let processing = false;

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!processing) {
      console.log("[transcode] Idle timeout reached, shutting down");
      pool.end().then(() => process.exit(0));
    }
  }, IDLE_SHUTDOWN_MS);
}

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok" }));

  if (!processing) {
    console.log("[transcode] Wake-up request received, checking for jobs");
    resetIdleTimer();
    setImmediate(poll);
  }
});

server.listen(process.env.PORT ?? 8080, () => {
  console.log(`[transcode] HTTP server listening on port ${process.env.PORT ?? 8080}`);
});

async function downloadFromR2(key) {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const chunks = [];
  for await (const chunk of res.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function uploadToR2(key, data, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }),
  );
}

function runFFmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-i", inputPath,
        "-c:a", "aac",
        "-b:a", "256k",
        "-movflags", "+faststart",
        "-y",
        outputPath,
      ],
      { timeout: 300_000 },
      (err, _stdout, stderr) => {
        if (err) {
          reject(new Error(`FFmpeg failed: ${stderr || err.message}`));
        } else {
          resolve();
        }
      },
    );
  });
}

async function claimJob() {
  const result = await pool.query(
    `UPDATE "TranscodeJob"
     SET status = 'PROCESSING', "updatedAt" = NOW()
     WHERE id = (
       SELECT id FROM "TranscodeJob"
       WHERE status = 'PENDING' AND attempts < $1
       ORDER BY "createdAt" ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, "versionId"`,
    [MAX_ATTEMPTS],
  );
  return result.rows[0] ?? null;
}

async function getVersionInfo(versionId) {
  const result = await pool.query(
    `SELECT "filePath", "songId" FROM "SongVersion" WHERE id = $1`,
    [versionId],
  );
  return result.rows[0] ?? null;
}

async function getSongProjectId(songId) {
  const result = await pool.query(
    `SELECT "projectId" FROM "Song" WHERE id = $1`,
    [songId],
  );
  return result.rows[0]?.projectId ?? null;
}

async function processJob(job) {
  const { id: jobId, versionId } = job;
  console.log(`[transcode] Processing job ${jobId} for version ${versionId}`);

  const version = await getVersionInfo(versionId);
  if (!version) {
    await markFailed(jobId, "Version not found in database");
    return;
  }

  const projectId = await getSongProjectId(version.songId);
  const tmpDir = await mkdtemp(join(tmpdir(), "transcode-"));
  const ext = version.filePath.substring(version.filePath.lastIndexOf("."));
  const inputPath = join(tmpDir, `input${ext}`);
  const outputPath = join(tmpDir, "compressed.m4a");

  try {
    console.log(`[transcode] Downloading ${version.filePath}`);
    const fileData = await downloadFromR2(version.filePath);
    await writeFile(inputPath, fileData);

    console.log(`[transcode] Running FFmpeg`);
    await runFFmpeg(inputPath, outputPath);

    const compressedData = await readFile(outputPath);
    const compressedKey = `projects/${projectId}/songs/${version.songId}/versions/${versionId}/compressed.m4a`;

    console.log(`[transcode] Uploading compressed file to ${compressedKey}`);
    await uploadToR2(compressedKey, compressedData, "audio/mp4");

    await pool.query(
      `UPDATE "SongVersion"
       SET "compressedFilePath" = $1, "uploadStatus" = 'READY'
       WHERE id = $2`,
      [compressedKey, versionId],
    );

    await pool.query(
      `UPDATE "TranscodeJob"
       SET status = 'COMPLETE', "updatedAt" = NOW()
       WHERE id = $1`,
      [jobId],
    );

    console.log(`[transcode] Job ${jobId} complete`);
  } catch (err) {
    console.error(`[transcode] Job ${jobId} failed:`, err.message);
    await markFailed(jobId, err.message);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

async function markFailed(jobId, errorMessage) {
  const result = await pool.query(
    `UPDATE "TranscodeJob"
     SET attempts = attempts + 1,
         "lastError" = $1,
         status = CASE WHEN attempts + 1 >= $2 THEN 'FAILED' ELSE 'PENDING' END,
         "updatedAt" = NOW()
     WHERE id = $3
     RETURNING attempts, status`,
    [errorMessage, MAX_ATTEMPTS, jobId],
  );

  const row = result.rows[0];
  if (row?.status === "FAILED") {
    await pool.query(
      `UPDATE "SongVersion"
       SET "uploadStatus" = 'FAILED'
       WHERE id = (SELECT "versionId" FROM "TranscodeJob" WHERE id = $1)`,
      [jobId],
    );
    console.error(`[transcode] Job ${jobId} permanently failed after ${row.attempts} attempts`);
  } else {
    console.log(`[transcode] Job ${jobId} will retry (attempt ${row?.attempts}/${MAX_ATTEMPTS})`);
  }
}

async function poll() {
  const job = await claimJob();
  if (job) {
    processing = true;
    resetIdleTimer();
    try {
      await processJob(job);
    } finally {
      processing = false;
    }
    setImmediate(poll);
  } else {
    resetIdleTimer();
  }
}

console.log("[transcode] Worker starting...");
resetIdleTimer();
poll().catch((err) => {
  console.error("[transcode] Fatal error:", err);
  process.exit(1);
});
