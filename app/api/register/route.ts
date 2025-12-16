import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

const registrationsFile = join(process.cwd(), "data", "registrations.json");
const eventsFile = join(process.cwd(), "data", "events.json");

let registrations: Array<{
  id: string;
  eventId: string;
  name: string;
  phone: string;
  registeredAt: string;
}> = [];

// Load registrations from file if it exists
if (existsSync(registrationsFile)) {
  try {
    const fs = require("fs");
    const data = fs.readFileSync(registrationsFile, "utf-8");
    registrations = JSON.parse(data);
  } catch (error) {
    console.error("Error loading registrations:", error);
  }
}

function saveRegistrations() {
  const fs = require("fs");
  if (!existsSync(join(process.cwd(), "data"))) {
    fs.mkdirSync(join(process.cwd(), "data"), { recursive: true });
  }
  fs.writeFileSync(registrationsFile, JSON.stringify(registrations, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, name, phone } = body;

    if (!eventId || !name || !phone) {
      return NextResponse.json(
        { error: "Event ID, name, and phone are required" },
        { status: 400 }
      );
    }

    // Load events to check if event exists and get title
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

    const event = events.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if already registered
    const existingRegistration = registrations.find(
      (r) => r.eventId === eventId && r.phone === phone
    );
    if (existingRegistration) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400 }
      );
    }

    // Check max participants
    if (event.maxParticipants) {
      const eventRegistrations = registrations.filter(
        (r) => r.eventId === eventId
      );
      if (eventRegistrations.length >= event.maxParticipants) {
        return NextResponse.json(
          { error: "Event is full" },
          { status: 400 }
        );
      }
    }

    const registration = {
      id: randomUUID(),
      eventId,
      name: name.trim(),
      phone: phone.trim(),
      registeredAt: new Date().toISOString(),
    };

    registrations.push(registration);
    saveRegistrations();

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}

