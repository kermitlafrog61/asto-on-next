import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

const dataFile = join(process.cwd(), "data", "merchandise.json");

let items: Array<{
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}> = [
  {
    id: "1",
    name: "AstroClub T-Shirt",
    description: "Comfortable cotton t-shirt with AstroClub logo",
    imageUrl: "/placeholder-merch.jpg",
  },
  {
    id: "2",
    name: "AstroClub Hoodie",
    description: "Warm hoodie perfect for stargazing nights",
    imageUrl: "/placeholder-merch.jpg",
  },
];

// Load merchandise from file if it exists
if (existsSync(dataFile)) {
  try {
    const fs = require("fs");
    const data = fs.readFileSync(dataFile, "utf-8");
    items = JSON.parse(data);
  } catch (error) {
    console.error("Error loading merchandise:", error);
  }
}

function saveMerchandise() {
  const fs = require("fs");
  if (!existsSync(join(process.cwd(), "data"))) {
    fs.mkdirSync(join(process.cwd(), "data"), { recursive: true });
  }
  fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
}

export async function GET() {
  try {
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching merchandise:", error);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, imageUrls } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    const urls = imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
    if (urls.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    const newItem = {
      id: randomUUID(),
      name: name.trim(),
      description: description.trim(),
      imageUrl: urls[0],
      imageUrls: urls,
    };

    items.push(newItem);
    saveMerchandise();

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error("Error creating merchandise:", error);
    return NextResponse.json(
      { error: "Failed to create merchandise item" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, imageUrl, imageUrls } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const itemIndex = items.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (name) items[itemIndex].name = name.trim();
    if (description) items[itemIndex].description = description.trim();
    
    if (imageUrls && imageUrls.length > 0) {
      items[itemIndex].imageUrls = imageUrls;
      items[itemIndex].imageUrl = imageUrls[0];
    } else if (imageUrl) {
      items[itemIndex].imageUrl = imageUrl.trim();
      items[itemIndex].imageUrls = [imageUrl.trim()];
    }

    saveMerchandise();

    return NextResponse.json({ success: true, item: items[itemIndex] });
  } catch (error) {
    console.error("Error updating merchandise:", error);
    return NextResponse.json(
      { error: "Failed to update merchandise item" },
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

    items = items.filter((item) => item.id !== id);
    saveMerchandise();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting merchandise:", error);
    return NextResponse.json(
      { error: "Failed to delete merchandise item" },
      { status: 500 }
    );
  }
}
