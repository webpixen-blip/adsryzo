import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const ads = await redis.get("ads") || [];
    const settings = await redis.get("settings") || {
      progressiveDelays: [5, 12, 24],
      sessionDuration: 3600
    };

    return NextResponse.json(
      { ads, settings },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
