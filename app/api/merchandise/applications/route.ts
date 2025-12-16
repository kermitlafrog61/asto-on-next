import { NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";

const applicationsFile = join(process.cwd(), "data", "merchandise-applications.json");

export async function GET() {
  try {
    let applications: Array<{
      id: string;
      itemId: string;
      itemName: string;
      name: string;
      phone: string;
      appliedAt: string;
    }> = [];

    if (existsSync(applicationsFile)) {
      const fs = require("fs");
      const data = fs.readFileSync(applicationsFile, "utf-8");
      applications = JSON.parse(data);
    }

    // Sort by most recent first
    applications.sort(
      (a, b) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ applications: [] });
  }
}

