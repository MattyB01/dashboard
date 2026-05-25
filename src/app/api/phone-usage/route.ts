import { NextRequest, NextResponse } from "next/server";

interface UsageReport {
  total_screen_mins: number;
  top_app: string;
  top_app_mins: number;
  current_app: string;
  apps: { pkg: string; mins: number }[];
  timestamp: number;
}

const TUNNEL_URL = process.env.TUNNEL_URL || "https://putting-demonstrate-permalink-baseline.trycloudflare.com";
const VPS_API_KEY = process.env.PHONE_USAGE_API_KEY || "cd02dbd02ed0bbaebecd254825d2ad7e84b295ae913bb929752099c3088ccb86";

export async function POST(req: NextRequest) {
  try {
    const body: UsageReport = await req.json();

    if (typeof body.total_screen_mins !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Forward to VPS via Cloudflare tunnel with API key auth
    try {
      await fetch(`${TUNNEL_URL}/phone-usage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": VPS_API_KEY,
        },
        body: JSON.stringify({ ...body, source: "vercel" }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (e) {
      console.error("Failed to forward to VPS:", e);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
