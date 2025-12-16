import { NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";

const registrationsFile = join(process.cwd(), "data", "registrations.json");
const eventsFile = join(process.cwd(), "data", "events.json");

export async function GET() {
  try {
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

    // Load events to get event titles
    let events: Array<{
      id: string;
      title: string;
      description: string;
      date: string;
      location: string;
      maxParticipants?: number;
    }> = [];

    if (existsSync(eventsFile)) {
      const fs = require("fs");
      const data = fs.readFileSync(eventsFile, "utf-8");
      events = JSON.parse(data);
    } else {
      // Use default events
      events = [
        {
          id: "1",
          title: "Stargazing Night",
          description: "Join us for an evening of stargazing and learn about constellations.",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: "KIMEP Campus Observatory",
          maxParticipants: 30,
        },
        {
          id: "2",
          title: "Astrophotography Workshop",
          description: "Learn how to capture stunning images of the night sky.",
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          location: "KIMEP Library",
          maxParticipants: 20,
        },
      ];
    }

    // Add event titles to registrations
    const registrationsWithEventTitles = registrations.map((reg) => {
      const event = events.find((e) => e.id === reg.eventId);
      return {
        ...reg,
        eventTitle: event?.title || "Unknown Event",
      };
    });

    // Sort by most recent first
    registrationsWithEventTitles.sort(
      (a, b) =>
        new Date(b.registeredAt).getTime() -
        new Date(a.registeredAt).getTime()
    );

    return NextResponse.json({
      registrations: registrationsWithEventTitles,
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ registrations: [] });
  }
}

