import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";

const applicationsFile = join(process.cwd(), "data", "merchandise-applications.json");

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = context.params;
    const id = params instanceof Promise ? (await params).id : params.id;

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

    const application = applications.find((a) => a.id === id);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Remove from array
    applications = applications.filter((a) => a.id !== id);

    // Save updated applications
    const fs = require("fs");
    fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}

