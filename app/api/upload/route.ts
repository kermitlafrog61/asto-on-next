import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

// Simple in-memory storage (in production, use a database)
let uploads: Array<{
  id: string;
  name: string;
  imageUrl: string;
  uploadedAt: string;
}> = [];

// Load uploads from file if it exists
const dataFile = join(process.cwd(), "data", "uploads.json");
if (existsSync(dataFile)) {
  try {
    const fs = require("fs");
    const data = fs.readFileSync(dataFile, "utf-8");
    uploads = JSON.parse(data);
  } catch (error) {
    console.error("Error loading uploads:", error);
  }
}

function saveUploads() {
  const fs = require("fs");
  if (!existsSync(join(process.cwd(), "data"))) {
    fs.mkdirSync(join(process.cwd(), "data"), { recursive: true });
  }
  fs.writeFileSync(dataFile, JSON.stringify(uploads, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const name = formData.get("name") as string;

    if (!file || !name) {
      return NextResponse.json(
        { error: "Image and name are required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const filename = `${randomUUID()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${filename}`;
    const upload = {
      id: randomUUID(),
      name: name.trim(),
      imageUrl,
      uploadedAt: new Date().toISOString(),
    };

    uploads.push(upload);
    saveUploads();

    return NextResponse.json({ success: true, upload });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

