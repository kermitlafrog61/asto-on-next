import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

const applicationsFile = join(process.cwd(), "data", "merchandise-applications.json");

let applications: Array<{
  id: string;
  itemId: string;
  itemName: string;
  name: string;
  phone: string;
  appliedAt: string;
}> = [];

// Load applications from file if it exists
if (existsSync(applicationsFile)) {
  try {
    const fs = require("fs");
    const data = fs.readFileSync(applicationsFile, "utf-8");
    applications = JSON.parse(data);
  } catch (error) {
    console.error("Error loading applications:", error);
  }
}

function saveApplications() {
  const fs = require("fs");
  if (!existsSync(join(process.cwd(), "data"))) {
    fs.mkdirSync(join(process.cwd(), "data"), { recursive: true });
  }
  fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemName, name, phone } = body;

    if (!itemId || !itemName || !name || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const application = {
      id: randomUUID(),
      itemId,
      itemName: itemName.trim(),
      name: name.trim(),
      phone: phone.trim(),
      appliedAt: new Date().toISOString(),
    };

    applications.push(application);
    saveApplications();

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

