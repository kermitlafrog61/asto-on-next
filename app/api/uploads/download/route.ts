import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync, readFileSync, createWriteStream, mkdirSync, rmSync } from "fs";
import { randomUUID } from "crypto";
import sharp from "sharp";
import archiver from "archiver";

const dataFile = join(process.cwd(), "data", "uploads.json");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadIds, addNames, downloadAll } = body;

    let uploads: Array<{
      id: string;
      name: string;
      imageUrl: string;
      uploadedAt: string;
    }> = [];

    if (existsSync(dataFile)) {
      const fs = require("fs");
      const data = fs.readFileSync(dataFile, "utf-8");
      uploads = JSON.parse(data);
    }

    const uploadsToDownload = downloadAll
      ? uploads
      : uploads.filter((u) => uploadIds.includes(u.id));

    if (uploadsToDownload.length === 0) {
      return NextResponse.json(
        { error: "No uploads to download" },
        { status: 400 }
      );
    }

    // For single image
    if (uploadsToDownload.length === 1 && !downloadAll) {
      const upload = uploadsToDownload[0];
      const filepath = join(process.cwd(), "public", upload.imageUrl);

      if (!existsSync(filepath)) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      if (addNames) {
        // Add name to image using sharp
        const image = sharp(filepath);
        const metadata = await image.metadata();
        const width = metadata.width || 1000;
        const height = metadata.height || 1000;
        
        // Calculate font size based on image dimensions (2% of image width, with min/max bounds)
        const baseFontSize = Math.max(24, Math.min(72, Math.floor(width * 0.02)));
        const fontSize = baseFontSize;
        const padding = Math.max(6, Math.floor(fontSize * 0.3));
        const margin = Math.max(10, Math.floor(width * 0.01));
        
        const textX = width - margin;
        const textY = height - margin;
        const textWidth = upload.name.length * (fontSize * 0.6); // Approximate width based on font size
        const textHeight = fontSize + padding * 2;
        const rectX = textX - textWidth - padding * 2;
        const rectY = textY - textHeight;
        
        const svg = `
          <svg width="${width}" height="${height}">
            <rect x="${rectX}" y="${rectY}" width="${textWidth + padding * 2}" height="${textHeight}" 
                  fill="black" opacity="0.7" rx="4"/>
            <text x="${textX}" y="${textY}" 
                  font-family="Arial" font-size="${fontSize}" font-weight="bold" 
                  fill="white" text-anchor="end" dominant-baseline="bottom">
              ${upload.name}
            </text>
          </svg>
        `;

        const buffer = await image
          .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
          .png()
          .toBuffer();

        return new NextResponse(buffer as unknown as BodyInit, {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="${upload.name.replace(/[^a-z0-9]/gi, '_')}_${upload.id}.png"`,
          },
        });
      } else {
        const fileBuffer = readFileSync(filepath);
        const ext = upload.imageUrl.split(".").pop();
        return new NextResponse(fileBuffer as unknown as BodyInit, {
          headers: {
            "Content-Type": `image/${ext}`,
            "Content-Disposition": `attachment; filename="${upload.name.replace(/[^a-z0-9]/gi, '_')}_${upload.id}.${ext}"`,
          },
        });
      }
    }

    // For multiple images, create a ZIP
    const tempDir = join(process.cwd(), "temp", randomUUID());
    mkdirSync(tempDir, { recursive: true });

    try {
      // Process images
      for (const upload of uploadsToDownload) {
        const filepath = join(process.cwd(), "public", upload.imageUrl);
        if (!existsSync(filepath)) continue;

        const ext = upload.imageUrl.split(".").pop();
        const safeName = upload.name.replace(/[^a-z0-9]/gi, "_");
        const outputPath = join(tempDir, `${safeName}_${upload.id}.${ext}`);

        if (addNames) {
          // Add name to image
          const image = sharp(filepath);
          const metadata = await image.metadata();
          const width = metadata.width || 1000;
          const height = metadata.height || 1000;
          
          // Calculate font size based on image dimensions (2% of image width, with min/max bounds)
          const baseFontSize = Math.max(24, Math.min(72, Math.floor(width * 0.02)));
          const fontSize = baseFontSize;
          const padding = Math.max(6, Math.floor(fontSize * 0.3));
          const margin = Math.max(10, Math.floor(width * 0.01));
          
          const textX = width - margin;
          const textY = height - margin;
          const textWidth = upload.name.length * (fontSize * 0.6); // Approximate width based on font size
          const textHeight = fontSize + padding * 2;
          const rectX = textX - textWidth - padding * 2;
          const rectY = textY - textHeight;
          
          const svg = `
            <svg width="${width}" height="${height}">
              <rect x="${rectX}" y="${rectY}" width="${textWidth + padding * 2}" height="${textHeight}" 
                    fill="black" opacity="0.7" rx="4"/>
              <text x="${textX}" y="${textY}" 
                    font-family="Arial" font-size="${fontSize}" font-weight="bold" 
                    fill="white" text-anchor="end" dominant-baseline="bottom">
                ${upload.name}
              </text>
            </svg>
          `;

          await image
            .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
            .png()
            .toFile(outputPath.replace(`.${ext}`, ".png"));
        } else {
          const fs = require("fs");
          fs.copyFileSync(filepath, outputPath);
        }
      }

      // Create ZIP
      const zipPath = join(tempDir, "astroclub_uploads.zip");
      const output = createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      return new Promise<NextResponse>((resolve, reject) => {
        archive.pipe(output);

        const fs = require("fs");
        const files = fs.readdirSync(tempDir).filter((f: string) => !f.endsWith(".zip"));
        files.forEach((file: string) => {
          archive.file(join(tempDir, file), { name: file });
        });

        archive.finalize();

        output.on("close", () => {
          try {
            const zipBuffer = readFileSync(zipPath);
            // Cleanup
            rmSync(tempDir, { recursive: true, force: true });

            resolve(
              new NextResponse(zipBuffer as unknown as BodyInit, {
                headers: {
                  "Content-Type": "application/zip",
                  "Content-Disposition": "attachment; filename=astroclub_uploads.zip",
                },
              })
            );
          } catch (err) {
            rmSync(tempDir, { recursive: true, force: true });
            reject(err);
          }
        });

        archive.on("error", (err) => {
          rmSync(tempDir, { recursive: true, force: true });
          reject(err);
        });
      });
    } catch (error) {
      rmSync(tempDir, { recursive: true, force: true });
      throw error;
    }
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download images" },
      { status: 500 }
    );
  }
}
