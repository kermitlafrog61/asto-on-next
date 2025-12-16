import { existsSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

const registrationsFile = join(process.cwd(), "data", "registrations.json");

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = context.params;
    const id = params instanceof Promise ? (await params).id : params.id;

    let registrations: Array<{
      id: string;
      eventId: string;
      name: string;
      phone: string;
      registeredAt: string;
    }> = [];

    if (existsSync(registrationsFile)) {
      const fs = require("fs");
      const data = fs.readFileSync(registrationsFile, "utf-8");
      registrations = JSON.parse(data);
    }

    const registration = registrations.find((r) => r.id === id);
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Remove from array
    registrations = registrations.filter((r) => r.id !== id);

    // Save updated registrations
    const fs = require("fs");
    fs.writeFileSync(registrationsFile, JSON.stringify(registrations, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting registration:", error);
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 }
    );
  }
}

