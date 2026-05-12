import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import webpush from "web-push";

console.log("");
console.log("  ╔══════════════════════════════════════╗");
console.log("  ║       RiffSync Local Dev Setup       ║");
console.log("  ╚══════════════════════════════════════╝");
console.log("");

if (!existsSync(".env")) {
  if (!existsSync(".env.example")) {
    console.error("  ✗ .env.example not found. Are you in the project root?");
    process.exit(1);
  }

  console.log("  Creating .env from .env.example...");
  let env = readFileSync(".env.example", "utf-8");

  const vapidKeys = webpush.generateVAPIDKeys();
  env = env.replace("VAPID_PUBLIC_KEY=", `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  env = env.replace("VAPID_PRIVATE_KEY=", `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);

  writeFileSync(".env", env);
  console.log("  ✓ .env created with VAPID keys\n");
  console.log("  ⚠ Fill in your Supabase and R2 credentials in .env before running the app.\n");
} else {
  console.log("  ✓ .env already exists, skipping\n");
}

console.log("  Generating Prisma client...");
execSync("npx prisma generate", { stdio: "inherit" });
console.log("");

console.log("  Running database migrations...");
execSync("npx prisma migrate dev --name init 2>/dev/null || npx prisma db push", { stdio: "inherit" });
console.log("");

console.log("  ╔══════════════════════════════════════╗");
console.log("  ║         Setup complete!              ║");
console.log("  ╚══════════════════════════════════════╝");
console.log("");
console.log("  Run 'npm run dev' to start the app.");
console.log("  Open http://localhost:3000 in your browser.");
console.log("");
