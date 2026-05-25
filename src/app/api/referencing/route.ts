import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AutoFillResult {
  title?: string;
  authors?: string;
  siteName?: string;
  publisher?: string;
  publicationDate?: string;
  description?: string;
  sourceType?: string;
  journalName?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  error?: string;
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isBulk = searchParams.get("bulk") === "true";

  try {
    if (isBulk) {
      const { urls } = await request.json();
      if (!Array.isArray(urls) || urls.length === 0) {
        return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
      }

      // Process up to 5 concurrently to avoid timeouts / rate-limiting
      const results: ({ url: string } & AutoFillResult)[] = [];
      for (let i = 0; i < urls.length; i += 5) {
        const batch = urls.slice(i, i + 5).map((u: string) =>
          extractMetadata(u.trim()).then((r) => ({ url: u.trim(), ...r }))
        );
        const batchResults = await Promise.allSettled(batch);
        for (const r of batchResults) {
          if (r.status === "fulfilled") results.push(r.value);
          else results.push({ url: "", error: r.reason?.message || "Unknown error" });
        }
      }

      return NextResponse.json({ results });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }
    const result = await extractMetadata(url);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process URL" },
      { status: 500 }
    );
  }
}

// ─── URL metadata extraction ────────────────────────────────────────────────

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function extractMetadata(rawUrl: string): Promise<AutoFillResult> {
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { error: "Invalid URL format" };
  }

  // Detect source type from URL patterns first (before fetch)
  const urlSourceType = detectSourceTypeFromUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        error: `HTTP ${response.status} ${response.statusText}`,
        sourceType: urlSourceType,
      };
    }

    const html = await response.text();
    if (!html || html.length < 50) {
      return {
        error: "Page returned empty content",
        sourceType: urlSourceType,
      };
    }

    // ── Extract from JSON-LD first (most structured) ──
    const ld = extractJSONLD(html);
    const ldBest = ld.length > 0 ? ld[0] : null;

    // ── Extract meta tags ──
    const ogTitle = extractMeta(html, "og:title");
    const ogSiteName = extractMeta(html, "og:site_name");
    const ogDescription = extractMeta(html, "og:description");
    const ogType = extractMeta(html, "og:type");
    const metaAuthor =
      extractMeta(html, "author") ||
      extractMeta(html, "article:author") ||
      extractMeta(html, "dc.creator") ||
      "";
    const metaDate =
      extractMeta(html, "article:published_time") ||
      extractMeta(html, "date") ||
      extractMeta(html, "dc.date") ||
      "";

    // Citation-specific meta tags
    const citationJournal = extractMeta(html, "citation_journal_title");
    const citationVolume = extractMeta(html, "citation_volume");
    const citationIssue = extractMeta(html, "citation_issue");
    const citationFirstPage = extractMeta(html, "citation_firstpage");
    const citationLastPage = extractMeta(html, "citation_lastpage");
    const citationDoi = extractMeta(html, "citation_doi");
    const citationAuthor = extractMeta(html, "citation_author");
    const citationDate = extractMeta(html, "citation_date");

    // ── Fallback: <title> ──
    const titleTag = extractTitleTag(html);

    // ── Assemble ──
    const title =
      ldBest?.name || ldBest?.headline || ogTitle || citationJournal || titleTag || "";
    const authors =
      ldBest?.author
        ? extractLdAuthors(ldBest.author)
        : citationAuthor || metaAuthor || "";
    const siteName =
      ldBest?.publisher?.name || ldBest?.sourceOrganization?.name || ogSiteName || "";
    const publicationDate =
      ldBest?.datePublished || ldBest?.date || metaDate || citationDate || "";
    const description = ldBest?.description || ogDescription || "";
    const finalDoi = citationDoi || ldBest?.sameAs || "";

    // Detect source type from page metadata
    const detectedSourceType = detectSourceTypeFromPage(
      url,
      html,
      ogType || "", 
      citationJournal ? "journal" : "",
      urlSourceType,
      ldBest?.["@type"] || ""
    );

    const result: AutoFillResult = {
      title: title || undefined,
      authors: authors || undefined,
      siteName: siteName || undefined,
      publisher: siteName || undefined,
      publicationDate: formatPubDate(publicationDate) || undefined,
      description: description || undefined,
      sourceType: detectedSourceType,
      journalName: citationJournal || undefined,
      volume: citationVolume || undefined,
      issue: citationIssue || undefined,
      pages:
        citationFirstPage
          ? `${citationFirstPage}–${citationLastPage || ""}`
          : undefined,
      doi: finalDoi || undefined,
    };

    // If we got nothing useful, mark as partial
    if (!result.title && !result.authors) {
      result.error = "Could not auto-fill metadata from this page (it may be blocked or have no structured data)";
    }

    return result;
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { error: "Request timed out", sourceType: urlSourceType };
    }
    return { error: err.message || "Failed to fetch", sourceType: urlSourceType };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── HTML extraction helpers ─────────────────────────────────────────────────

function extractMeta(html: string, property: string): string | undefined {
  // Match <meta property="..." content="..." /> or <meta name="..." content="..." />
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapeRegex(property)}["'][^>]+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapeRegex(property)}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeHtmlEntities(m[1].trim());
  }
  return undefined;
}

function extractTitleTag(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (m) return decodeHtmlEntities(m[1].trim().replace(/\s+/g, " "));
  return undefined;
}

function extractJSONLD(html: string): any[] {
  const results: any[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@type"] && typeof item === "object") results.push(item);
      }
    } catch {
      // Skip malformed JSON-LD
    }
  }
  return results;
}

function extractLdAuthors(author: any): string {
  if (typeof author === "string") return author;
  if (Array.isArray(author)) {
    return author
      .map((a: any) => (typeof a === "string" ? a : a.name))
      .filter(Boolean)
      .join(", ");
  }
  return author?.name || "";
}

// ─── Source type detection ───────────────────────────────────────────────────

function detectSourceTypeFromUrl(url: string): string | undefined {
  const u = url.toLowerCase();
  if (
    u.includes("youtube.com") ||
    u.includes("youtu.be") ||
    u.includes("vimeo.com")
  )
    return "youtube";
  if (u.includes("scholar.google")) return "journal";
  if (u.includes("doi.org")) return "journal";
  return undefined;
}

function detectSourceTypeFromPage(
  url: string,
  _html: string,
  ogType: string,
  citationJournal: string,
  urlType: string | undefined,
  ldType: string
): string {
  // URL hints take precedence
  if (urlType === "youtube") return "youtube";

  // Journal article (citation meta tags present)
  if (citationJournal) return "journal";

  // JSON-LD type
  const ldTypeLower = ldType.toLowerCase();
  if (ldTypeLower.includes("scholarlyarticle")) return "journal";
  if (ldTypeLower.includes("newsarticle")) return "news";
  if (ldTypeLower.includes("book")) return "book";
  if (ldTypeLower.includes("report")) return "report";

  // OpenGraph
  const ogLower = ogType.toLowerCase();
  if (ogLower.includes("article")) {
    // Check if it looks like news
    const newsDomains = [
      "bbc",
      "cnn",
      "nytimes",
      "theguardian",
      "smh",
      "theage",
      "abc.net.au",
      "news.com.au",
      "reuters",
      "bloomberg",
      "wsj",
      "wp",
      "washingtonpost",
      "theconversation",
    ];
    try {
      const hostname = new URL(url).hostname;
      if (newsDomains.some((d) => hostname.includes(d))) return "news";
    } catch {}
    return "website";
  }
  if (ogLower.includes("video") || ogLower.includes("video.other")) return "youtube";
  if (ogLower.includes("book")) return "book";

  return "website";
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(parseInt(n, 10)));
}

function formatPubDate(raw: string): string {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).replace(/\//g, " ");
  } catch {
    return raw;
  }
}
