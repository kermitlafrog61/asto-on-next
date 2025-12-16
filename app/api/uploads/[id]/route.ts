import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync, unlinkSync } from "fs";

const dataFile = join(process.cwd(), "data", "uploads.json");

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const upload = uploads.find((u) => u.id === params.id);
    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // Delete the file
    const filepath = join(process.cwd(), "public", upload.imageUrl);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }

    // Remove from array
    uploads = uploads.filter((u) => u.id !== params.id);

    // Save updated uploads
    const fs = require("fs");
    fs.writeFileSync(dataFile, JSON.stringify(uploads, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting upload:", error);
    return NextResponse.json(
      { error: "Failed to delete upload" },
      { status: 500 }
    );
  }
}

