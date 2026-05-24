import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "POST");
}

async function proxyRequest(request: NextRequest, method: string) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-AU,en;q=0.9",
    };

    let body: string | undefined;
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(await request.json());
    }

    const resp = await fetch(url, { method, headers, body });

    const text = await resp.text();
    return new NextResponse(text, {
      headers: {
        "Content-Type": resp.headers.get("content-type") || "text/html",
        "X-Proxy-Status": `${resp.status}`,
      },
    });
  } catch (e: unknown) {
    const err = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
