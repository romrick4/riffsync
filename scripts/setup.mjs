import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import webpush from "web-push";

function run(cmd, opts = {}) {
  console.log(`  → ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

console.log("");
console.log("  ╔══════════════════════════════════════╗");
console.log("  ║       RiffSync Local Dev Setup       ║");
console.log("  ╚══════════════════════════════════════╝");
console.log("");

// 1. Create .env if missing
if (!existsSync(".env")) {
  if (!existsSync(".env.example")) {
    console.error("  ✗ .env.example not found. Are you in the project root?");
    process.exit(1);
  }

  console.log("  Creating .env from .env.example...");
  let env = readFileSync(".env.example", "utf-8");

  const secret = randomBytes(32).toString("base64");
  env = env.replace("change-me-to-a-random-string", secret);

  const dbPassword = randomBytes(16).toString("hex");
  env = env.replaceAll("change-me-to-a-strong-password", dbPassword);

  const vapidKeys = webpush.generateVAPIDKeys();
  env = env.replace("VAPID_PUBLIC_KEY=", `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  env = env.replace("VAPID_PRIVATE_KEY=", `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);

  writeFileSync(".env", env);
  console.log("  ✓ .env created with generated secrets\n");
  console.log("  ✓ VAPID keys generated for push notifications\n");
} else {
  // If .env exists but is missing VAPID keys, add them
  let env = readFileSync(".env", "utf-8");
  if (!env.includes("VAPID_PUBLIC_KEY=") || env.match(/VAPID_PUBLIC_KEY=\s*$/m)) {
    const vapidKeys = webpush.generateVAPIDKeys();
    const additions = [
      "",
      "# Push Notifications (auto-generated)",
      `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`,
      `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`,
      `VAPID_SUBJECT=mailto:admin@localhost`,
    ].join("\n");

    if (!env.includes("VAPID_PUBLIC_KEY")) {
      env += additions + "\n";
    } else {
      env = env.replace(/VAPID_PUBLIC_KEY=\s*$/m, `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
      env = env.replace(/VAPID_PRIVATE_KEY=\s*$/m, `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    }
    writeFileSync(".env", env);
    console.log("  ✓ VAPID keys generated and added to .env\n");
  } else {
    console.log("  ✓ .env already exists, skipping\n");
  }
}

// 2. Start Postgres via Docker (just the DB, not the full app)
console.log("  Starting PostgreSQL via Docker...");
let dockerOk = false;
try {
  // Stop any existing riffsync db container to avoid port conflicts
  execSync("docker compose down db 2>/dev/null", { stdio: "pipe" });
} catch { /* ignore */ }
try {
  execSync("docker compose up -d db", { stdio: "inherit" });
  dockerOk = true;
  console.log("  ✓ PostgreSQL container started\n");
} catch {
  console.log("  ⚠ Could not start Postgres via Docker.");
  console.log("    Make sure Docker is running, or start Postgres manually.");
  console.log("    Then update DATABASE_URL in .env to point to it.\n");
}

// 3. Wait for Postgres to be ready
if (dockerOk) {
  console.log("  Waiting for Postgres to accept connections...");
  let ready = false;
  for (let i = 0; i < 15; i++) {
    try {
      execSync('docker compose exec -T db pg_isready -U postgres', {
        stdio: "pipe",
      });
      ready = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (ready) {
    console.log("  ✓ Postgres is ready\n");
  } else {
    console.log("  ⚠ Postgres may not be ready yet. Continuing anyway...\n");
  }
}

// 4. Generate Prisma client
console.log("  Generating Prisma client...");
run("npx prisma generate");
console.log("");

// 5. Run migrations
console.log("  Running database migrations...");
run("npx prisma migrate dev --name init 2>/dev/null || npx prisma db push");
console.log("");

// 6. Create storage directory
if (!existsSync("storage")) {
  const { mkdirSync } = await import("fs");
  mkdirSync("storage", { recursive: true });
  console.log("  ✓ Created storage/ directory\n");
}

console.log("  ╔══════════════════════════════════════╗");
console.log("  ║         Setup complete!              ║");
console.log("  ╚══════════════════════════════════════╝");
console.log("");
console.log("  Run 'npm run dev' to start the app.");
console.log("  Open http://localhost:3000 in your browser.");
console.log("");
