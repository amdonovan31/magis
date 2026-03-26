import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const svgPath = resolve(rootDir, "public/magis_logo_clean.svg");
const outDir = resolve(rootDir, "public/icons");

// The SVG is 400x340 — we need to place it on a square canvas
const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-180.png", size: 180, maskable: false },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "icon-maskable-192.png", size: 192, maskable: true },
];

for (const { name, size, maskable } of sizes) {
  // For maskable icons, the safe zone is the inner 80% circle,
  // so we render the SVG smaller and add more padding
  const svgRenderSize = maskable ? Math.round(size * 0.7) : Math.round(size * 0.9);

  const resized = await sharp(svgBuffer)
    .resize(svgRenderSize, svgRenderSize, { fit: "contain", background: "#EEECE6" })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: "#EEECE6",
    },
  })
    .composite([
      {
        input: resized,
        gravity: "centre",
      },
    ])
    .png()
    .toFile(resolve(outDir, name));

  console.log(`Generated ${name} (${size}x${size})`);
}

console.log("Done!");
