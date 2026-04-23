import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { action, adId, data, password } = await req.json();

    // Verification Logic
    // If updating config, require password
    if (action === "update_config" || action === "add_ad" || action === "delete_ad") {
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      if (password !== adminPassword) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (action === "increment_view") {
      await redis.hincrby("analytics:views", adId, 1);
      return NextResponse.json({ success: true });
    }

    if (action === "save_ads") {
      await redis.set("ads", data);
      return NextResponse.json({ success: true });
    }

    if (action === "save_settings") {
      await redis.set("settings", data);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
