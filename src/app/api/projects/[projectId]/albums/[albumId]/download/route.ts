import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, verifyMembership } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import archiver from "archiver";
import { Readable, PassThrough } from "stream";

type RouteParams = { params: Promise<{ projectId: string; albumId: string }> };

function sanitize(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim();
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, albumId } = await params;

  const membership = await verifyMembership(projectId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not a project member" }, { status: 403 });
  }

  const album = await prisma.album.findUnique({
    where: { id: albumId, projectId },
    include: {
      project: { select: { name: true } },
      songs: {
        include: {
          versions: {
            where: { isFinal: true },
            select: {
              id: true,
              title: true,
              filePath: true,
              fileName: true,
              fileFormat: true,
              fileSizeBytes: true,
            },
            take: 1,
          },
        },
        orderBy: { trackNumber: "asc" },
      },
    },
  });

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  // Validate: at least one song with a final version
  const songsWithFinal = album.songs.filter((s) => s.versions.length > 0);
  if (songsWithFinal.length === 0) {
    return NextResponse.json(
      { error: "No songs with final versions to download" },
      { status: 400 },
    );
  }

  const artistName = sanitize(album.artistName || album.project.name);
  const albumTitle = sanitize(album.title);
  const folderName = `${artistName} - ${albumTitle}`;

  const storage = getStorage();
  const passthrough = new PassThrough();

  const archive = archiver("zip", { zlib: { level: 5 } });
  archive.pipe(passthrough);

  // Add cover art if present
  if (album.coverArtPath) {
    try {
      const coverBuffer = await storage.get(album.coverArtPath);
      const ext = album.coverArtPath.substring(album.coverArtPath.lastIndexOf("."));
      archive.append(coverBuffer, { name: `${folderName}/cover${ext}` });
    } catch {
      // Skip if cover art can't be loaded
    }
  }

  // Add audio files
  for (const song of songsWithFinal) {
    const version = song.versions[0];
    const trackNum = song.trackNumber
      ? String(song.trackNumber).padStart(2, "0")
      : String(songsWithFinal.indexOf(song) + 1).padStart(2, "0");
    const ext = version.fileName.substring(version.fileName.lastIndexOf("."));
    const fileName = `${trackNum} - ${sanitize(song.title)}${ext}`;

    try {
      const audioBuffer = await storage.get(version.filePath);
      archive.append(audioBuffer, { name: `${folderName}/${fileName}` });
    } catch {
      // Skip files that can't be loaded
    }
  }

  // Add metadata CSV
  const csvHeader = "Track Number,Title,Artist,Featured Artists,Songwriters,ISRC,Explicit,Language,Genre,Duration";
  const csvRows = songsWithFinal.map((song) => {
    const trackNum = song.trackNumber || songsWithFinal.indexOf(song) + 1;
    return [
      trackNum,
      `"${song.title.replace(/"/g, '""')}"`,
      `"${artistName.replace(/"/g, '""')}"`,
      `"${(song.featuredArtists || "").replace(/"/g, '""')}"`,
      `"${(song.songwriters || "").replace(/"/g, '""')}"`,
      song.isrc || "",
      song.isExplicit ? "Yes" : "No",
      song.language || album.language || "en",
      album.genre || "",
      "",
    ].join(",");
  });
  const csvContent = [csvHeader, ...csvRows].join("\n");
  archive.append(csvContent, { name: `${folderName}/metadata.csv` });

  // Add a distribution readme
  const readme = `Distribution Package: ${albumTitle}
Artist: ${artistName}
${album.upc ? `UPC: ${album.upc}` : ""}
${album.releaseDate ? `Release Date: ${album.releaseDate.toISOString().split("T")[0]}` : ""}
Genre: ${album.genre || "Not set"}${album.secondaryGenre ? ` / ${album.secondaryGenre}` : ""}
Language: ${album.language || "en"}
Tracks: ${songsWithFinal.length}

Songs without final versions (not included):
${album.songs.filter((s) => s.versions.length === 0).map((s) => `  - ${s.title}`).join("\n") || "  (none)"}

Distribution Notes:
- Cover art should be at least 3000x3000 pixels, square, JPG format, RGB color space
- Audio files should be WAV 16-bit 44.1kHz for best quality
- Ensure all metadata fields are filled in before uploading to a distributor
`;
  archive.append(readme, { name: `${folderName}/README.txt` });

  archive.finalize();

  const webStream = Readable.toWeb(passthrough) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(folderName)}.zip"`,
    },
  });
}
