import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";
import * as XLSX from "xlsx";

const registrationsFile = join(process.cwd(), "data", "registrations.json");
const eventsFile = join(process.cwd(), "data", "events.json");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

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

    // Filter by event if eventId is provided
    if (eventId) {
      registrations = registrations.filter((r) => r.eventId === eventId);
    }

    // Load events to get event titles
    let events: Array<{
      id: string;
      title: string;
    }> = [];

    if (existsSync(eventsFile)) {
      const fs = require("fs");
      const data = fs.readFileSync(eventsFile, "utf-8");
      const eventsData = JSON.parse(data);
      events = eventsData.map((e: { id: string; title: string }) => ({
        id: e.id,
        title: e.title,
      }));
    }

    // Prepare data for Excel
    const excelData = registrations.map((reg) => {
      const event = events.find((e) => e.id === reg.eventId);
      return {
        "Event": event?.title || "Unknown Event",
        "Name": reg.name,
        "WhatsApp Phone": reg.phone,
        "Registered At": new Date(reg.registeredAt).toLocaleString(),
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 30 }, // Event
      { wch: 25 }, // Name
      { wch: 20 }, // Phone
      { wch: 25 }, // Registered At
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const filename = eventId
      ? `registrations_${eventId}.xlsx`
      : "all_registrations.xlsx";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export registrations" },
      { status: 500 }
    );
  }
}

