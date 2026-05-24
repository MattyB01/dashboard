import { NextRequest, NextResponse } from "next/server";

interface UsageReport {
  total_screen_mins: number;
  top_app: string;
  top_app_mins: number;
  current_app: string;
  apps: { pkg: string; mins: number }[];
  timestamp: number;
}

const VPS_WEBHOOK = "https://pastor-swimming-clinic-workout.trycloudflare.com/phone-usage";

export async function POST(req: NextRequest) {
  try {
    const body: UsageReport = await req.json();

    if (typeof body.total_screen_mins !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Forward to VPS for persistent storage
    try {
      await fetch(VPS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, source: "vercel" }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // VPS might not be reachable — phone still gets 200
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
