import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync, unlinkSync } from "fs";

const dataFile = join(process.cwd(), "data", "uploads.json");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadIds } = body;

    if (!uploadIds || !Array.isArray(uploadIds) || uploadIds.length === 0) {
      return NextResponse.json(
        { error: "Upload IDs are required" },
        { status: 400 }
      );
    }

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

    // Delete files
    const uploadsToDelete = uploads.filter((u) => uploadIds.includes(u.id));
    for (const upload of uploadsToDelete) {
      const filepath = join(process.cwd(), "public", upload.imageUrl);
      if (existsSync(filepath)) {
        unlinkSync(filepath);
      }
    }

    // Remove from array
    uploads = uploads.filter((u) => !uploadIds.includes(u.id));

    // Save updated uploads
    const fs = require("fs");
    fs.writeFileSync(dataFile, JSON.stringify(uploads, null, 2));

    return NextResponse.json({ success: true, deleted: uploadsToDelete.length });
  } catch (error) {
    console.error("Error deleting uploads:", error);
    return NextResponse.json(
      { error: "Failed to delete uploads" },
      { status: 500 }
    );
  }
}

