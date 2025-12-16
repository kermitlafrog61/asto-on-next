import { NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";

const dataFile = join(process.cwd(), "data", "uploads.json");

export async function GET() {
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

    // Sort by most recent first
    uploads.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("Error fetching uploads:", error);
    return NextResponse.json({ uploads: [] });
  }
}

