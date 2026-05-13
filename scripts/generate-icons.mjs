import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svgPath = resolve(root, "src/app/icon.svg");
const svg = readFileSync(svgPath);

const BG_COLOR = { r: 26, g: 26, b: 26, alpha: 1 }; // #1a1a1a

async function generate(outPath, size, { maskable = false } = {}) {
  let pipeline;

  if (maskable) {
    const iconSize = Math.round(size * 0.6);
    const icon = await sharp(svg).resize(iconSize, iconSize).png().toBuffer();
    pipeline = sharp({
      create: { width: size, height: size, channels: 4, background: BG_COLOR },
    })
      .composite([{ input: icon, gravity: "centre" }])
      .png();
  } else {
    pipeline = sharp(svg).resize(size, size).png();
  }

  await pipeline.toFile(outPath);
  console.log(`  ✓ ${outPath}`);
}

async function main() {
  mkdirSync(resolve(root, "public"), { recursive: true });

  console.log("Generating icons from src/app/icon.svg …\n");

  await Promise.all([
    generate(resolve(root, "public/icon-192.png"), 192),
    generate(resolve(root, "public/icon-512.png"), 512),
    generate(resolve(root, "public/icon-maskable-512.png"), 512, {
      maskable: true,
    }),
    generate(resolve(root, "src/app/apple-icon.png"), 180),
    generate(resolve(root, "public/apple-touch-icon.png"), 180),
  ]);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
