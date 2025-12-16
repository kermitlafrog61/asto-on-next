import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

const dataFile = join(process.cwd(), "data", "events.json");

// Default events
let events: Array<{
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  maxParticipants?: number;
}> = [
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

// Load events from file if it exists
if (existsSync(dataFile)) {
  try {
    const fs = require("fs");
    const data = fs.readFileSync(dataFile, "utf-8");
    events = JSON.parse(data);
  } catch (error) {
    console.error("Error loading events:", error);
  }
}

function saveEvents() {
  const fs = require("fs");
  if (!existsSync(join(process.cwd(), "data"))) {
    fs.mkdirSync(join(process.cwd(), "data"), { recursive: true });
  }
  fs.writeFileSync(dataFile, JSON.stringify(events, null, 2));
}

export async function GET() {
  try {
    // Sort by date
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({ events: sortedEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ events: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, date, location, maxParticipants } = body;

    if (!title || !description || !date || !location) {
      return NextResponse.json(
        { error: "Title, description, date, and location are required" },
        { status: 400 }
      );
    }

    const newEvent = {
      id: randomUUID(),
      title: title.trim(),
      description: description.trim(),
      date: date,
      location: location.trim(),
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
    };

    events.push(newEvent);
    saveEvents();

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, date, location, maxParticipants } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const eventIndex = events.findIndex((e) => e.id === id);
    if (eventIndex === -1) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (title) events[eventIndex].title = title.trim();
    if (description) events[eventIndex].description = description.trim();
    if (date) events[eventIndex].date = date;
    if (location) events[eventIndex].location = location.trim();
    if (maxParticipants !== undefined)
      events[eventIndex].maxParticipants = maxParticipants
        ? Number(maxParticipants)
        : undefined;

    saveEvents();

    return NextResponse.json({ success: true, event: events[eventIndex] });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    events = events.filter((e) => e.id !== id);
    saveEvents();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
