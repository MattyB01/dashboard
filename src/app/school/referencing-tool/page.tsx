"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SiteHeader from "@/components/SiteHeader";

// ─── Types ───────────────────────────────────────────────────────────────────

type SourceType = "website" | "journal" | "book" | "news" | "youtube" | "report";

interface Reference {
  id: string;
  sourceType: SourceType;
  authors: string;
  title: string;
  siteName: string;
  publisher: string;
  journalName: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  year: string;
  date: string;
  url: string;
  accessedDate: string;
  edition: string;
  reportNumber: string;
  channel: string;
}

interface SavedList {
  id: string;
  title: string;
  references: Reference[];
  createdAt: string;
  updatedAt: string;
}

interface BulkResult {
  url: string;
  title?: string;
  authors?: string;
  siteName?: string;
  publisher?: string;
  publicationDate?: string;
  sourceType?: string;
  journalName?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  error?: string;
}

// ─── Source type config ──────────────────────────────────────────────────────

const SOURCE_TYPES: { value: SourceType; label: string; icon: string }[] = [
  { value: "website", label: "Website", icon: "🌐" },
  { value: "journal", label: "Journal Article", icon: "📄" },
  { value: "book", label: "Book", icon: "📚" },
  { value: "news", label: "News Article", icon: "📰" },
  { value: "youtube", label: "YouTube Video", icon: "▶️" },
  { value: "report", label: "Report / Document", icon: "📋" },
];

const SOURCE_FIELDS: Record<
  SourceType,
  { key: keyof Reference; label: string; placeholder: string; required: boolean }[]
> = {
  website: [
    { key: "authors", label: "Author(s)", placeholder: "e.g. Smith, J.", required: false },
    { key: "title", label: "Title", placeholder: "Page title", required: true },
    { key: "siteName", label: "Site Name", placeholder: "e.g. BBC News", required: false },
    { key: "date", label: "Date", placeholder: "Year, Month Day or leave blank", required: false },
  ],
  journal: [
    { key: "authors", label: "Author(s)", placeholder: "e.g. Smith, J., & Jones, A.", required: true },
    { key: "title", label: "Article Title", placeholder: "Title of the article", required: true },
    { key: "journalName", label: "Journal Name", placeholder: "e.g. Nature", required: true },
    { key: "volume", label: "Volume", placeholder: "e.g. 42", required: false },
    { key: "issue", label: "Issue", placeholder: "e.g. 3", required: false },
    { key: "pages", label: "Pages", placeholder: "e.g. 123–145", required: false },
    { key: "doi", label: "DOI", placeholder: "e.g. 10.1234/example", required: false },
    { key: "year", label: "Year", placeholder: "e.g. 2024", required: true },
  ],
  book: [
    { key: "authors", label: "Author(s)", placeholder: "e.g. Smith, J.", required: true },
    { key: "title", label: "Title", placeholder: "Title of the book", required: true },
    { key: "publisher", label: "Publisher", placeholder: "e.g. MIT Press", required: true },
    { key: "year", label: "Year", placeholder: "e.g. 2024", required: true },
    { key: "edition", label: "Edition", placeholder: "e.g. 2nd ed.", required: false },
  ],
  news: [
    { key: "authors", label: "Author(s)", placeholder: "e.g. Smith, J.", required: false },
    { key: "title", label: "Headline", placeholder: "Title of the article", required: true },
    { key: "siteName", label: "Newspaper / Publication", placeholder: "e.g. The Guardian", required: true },
    { key: "date", label: "Date", placeholder: "Year, Month Day", required: false },
  ],
  youtube: [
    { key: "authors", label: "Creator / Uploader", placeholder: "e.g. Smith, J.", required: true },
    { key: "channel", label: "Channel Name", placeholder: "e.g. CrashCourse", required: false },
    { key: "title", label: "Video Title", placeholder: "Title of the video", required: true },
    { key: "date", label: "Date", placeholder: "Year, Month Day", required: false },
  ],
  report: [
    { key: "authors", label: "Author(s) / Organization", placeholder: "e.g. WHO", required: true },
    { key: "title", label: "Report Title", placeholder: "Title of the report", required: true },
    { key: "reportNumber", label: "Report Number", placeholder: "e.g. No. 123", required: false },
    { key: "publisher", label: "Publisher", placeholder: "e.g. Government Publishing", required: false },
    { key: "year", label: "Year", placeholder: "e.g. 2024", required: true },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayFormatted(): string {
  const d = new Date();
  return d.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateForAPA(raw: string): string {
  if (!raw) return "n.d.";
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  if (/^\d{4}$/.test(raw)) return raw;
  return raw;
}

function cleanUrl(url: string): string {
  if (!url) return "";
  let u = url.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
  return u;
}

const STORAGE_KEY = "referencing-saved-lists";

// ─── Citation formatter ──────────────────────────────────────────────────────

function citationHtml(ref: Reference): string {
  const author = ref.authors ? ref.authors.replace(/<[^>]*>/g, "") : "";
  const title = ref.title.replace(/<[^>]*>/g, "");
  const url = cleanUrl(ref.url);

  switch (ref.sourceType) {
    case "website": {
      const aPart = author ? `${author}. ` : "";
      const dPart = ref.date || ref.year || "n.d.";
      const sPart = ref.siteName ? ` <em>${ref.siteName}</em>.` : ".";
      return `${aPart}(${dPart}). ${title}${sPart} ${url}`;
    }
    case "journal": {
      const aPart = author ? `${author}. ` : "";
      const yPart = ref.year || "n.d.";
      const jPart = ref.journalName ? ` <em>${ref.journalName}</em>` : "";
      const vPart = ref.volume ? `, <em>${ref.volume}</em>` : "";
      const iPart = ref.issue ? `(${ref.issue})` : "";
      const pPart = ref.pages ? `, ${ref.pages}` : "";
      const doiPart = ref.doi
        ? ` https://doi.org/${ref.doi.replace(/^https?:\/\/doi\.org\//, "")}`
        : url
        ? ` ${url}`
        : "";
      return `${aPart}(${yPart}). ${title}.${jPart}${vPart}${iPart}${pPart}.${doiPart}`;
    }
    case "book": {
      const aPart = author ? `${author}. ` : "";
      const yPart = ref.year || "n.d.";
      const ePart = ref.edition ? ` (${ref.edition}).` : ".";
      return `${aPart}(${yPart}). <em>${title}</em>${ePart} ${ref.publisher ? ref.publisher : ""}`;
    }
    case "news": {
      const aPart = author ? `${author}. ` : "";
      const dPart = ref.date || ref.year || "n.d.";
      const sPart = ref.siteName ? ` <em>${ref.siteName}</em>.` : ".";
      return `${aPart}(${dPart}). ${title}.${sPart} ${url}`;
    }
    case "youtube": {
      const aPart = author ? `${author}` : "";
      const channelPart = ref.channel ? ` [${ref.channel}]` : "";
      const dPart = ref.date || ref.year || "n.d.";
      return `${aPart}${channelPart} (${dPart}). <em>${title}</em> [Video]. YouTube. ${url}`;
    }
    case "report": {
      const aPart = author ? `${author}. ` : "";
      const yPart = ref.year || "n.d.";
      const nPart = ref.reportNumber ? ` (${ref.reportNumber}).` : ".";
      const pPart = ref.publisher && !author.includes(ref.publisher) ? ` ${ref.publisher}.` : "";
      return `${aPart}(${yPart}). <em>${title}</em>${nPart}${pPart} ${url}`;
    }
    default:
      return `${author} (${ref.year || "n.d."}). ${title}. ${url}`;
  }
}

function citationPlain(ref: Reference): string {
  return citationHtml(ref).replace(/<\/?em>/g, "");
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ReferencingTool() {
  // ── State ──
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState("Untitled List");
  const [references, setReferences] = useState<Reference[]>([]);
  const [tab, setTab] = useState<"single" | "bulk">("single");

  const [sourceType, setSourceType] = useState<SourceType>("website");
  const [urlInput, setUrlInput] = useState("");
  const [autoFillStatus, setAutoFillStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [autoFillError, setAutoFillError] = useState("");
  const [form, setForm] = useState<Reference>(emptyRef());

  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [bulkStatus, setBulkStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [selectedBulk, setSelectedBulk] = useState<Set<number>>(new Set());
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Init: load from localStorage ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const lists: SavedList[] = JSON.parse(stored);
        setSavedLists(lists);
        if (lists.length > 0) {
          const last = lists[lists.length - 1];
          loadList(last);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowListDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Persist ──
  const persistLists = useCallback(
    (lists: SavedList[]) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
      setSavedLists(lists);
    },
    []
  );

  // ── List management ──
  function saveCurrentList() {
    try {
      let lists = [...savedLists];
      if (currentListId) {
        lists = lists.map((l) =>
          l.id === currentListId
            ? { ...l, title: currentTitle, references, updatedAt: new Date().toISOString() }
            : l
        );
      } else {
        const newId = uid();
        lists.push({
          id: newId,
          title: currentTitle,
          references,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setCurrentListId(newId);
      }
      persistLists(lists);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save list. Check console for details.");
    }
  }

  function loadList(list: SavedList) {
    setCurrentListId(list.id);
    setCurrentTitle(list.title);
    setReferences(list.references);
  }

  function newList() {
    if (references.length > 0 && !confirm("Discard current list and start fresh?")) return;
    setCurrentListId(null);
    setCurrentTitle("Untitled List");
    setReferences([]);
    setBulkResults([]);
    setSelectedBulk(new Set());
  }

  function deleteList(id: string) {
    if (!confirm("Delete this saved list?")) return;
    persistLists(savedLists.filter((l) => l.id !== id));
    if (currentListId === id) {
      setCurrentListId(null);
      setCurrentTitle("Untitled List");
      setReferences([]);
    }
  }

  // ── Form helpers ──
  function emptyRef(): Reference {
    return {
      id: "", sourceType: "website", authors: "", title: "", siteName: "",
      publisher: "", journalName: "", volume: "", issue: "", pages: "", doi: "",
      year: "", date: "", url: "", accessedDate: todayFormatted(), edition: "",
      reportNumber: "", channel: "",
    };
  }

  function resetForm() {
    setForm({ ...emptyRef(), sourceType, accessedDate: todayFormatted() });
    setUrlInput("");
    setAutoFillStatus("idle");
    setAutoFillError("");
  }

  function updateField(key: keyof Reference, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function changeSourceType(st: SourceType) {
    setSourceType(st);
    setForm({ ...emptyRef(), sourceType: st, accessedDate: todayFormatted() });
    setUrlInput("");
    setAutoFillStatus("idle");
    setAutoFillError("");
  }

  // ── Auto-fill from URL ──
  async function handleAutoFill() {
    const url = urlInput.trim();
    if (!url) return;
    setAutoFillStatus("loading");
    setAutoFillError("");

    try {
      const res = await fetch("/api/referencing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.error) {
        if (data.sourceType && data.sourceType !== "website") {
          setSourceType(data.sourceType as SourceType);
        }
        setAutoFillStatus("error");
        setAutoFillError(data.error);
        return;
      }

      const detectedType = (data.sourceType as SourceType) || sourceType;
      setSourceType(detectedType);

      const dateStr = data.publicationDate
        ? formatDateForAPA(data.publicationDate)
        : "";

      setForm({
        id: "", sourceType: detectedType,
        authors: data.authors || "",
        title: data.title || "",
        siteName: data.siteName || data.publisher || "",
        publisher: data.publisher || data.siteName || "",
        journalName: data.journalName || "",
        volume: data.volume || "",
        issue: data.issue || "",
        pages: data.pages || "",
        doi: data.doi || "",
        year: dateStr.match(/^\d{4}/)?.[0] || "",
        date: dateStr,
        url: cleanUrl(urlInput),
        accessedDate: todayFormatted(),
        edition: "", reportNumber: "", channel: "",
      });

      setAutoFillStatus("done");
    } catch (err: any) {
      setAutoFillStatus("error");
      setAutoFillError(err.message || "Failed to auto-fill");
    }
  }

  // ── Add reference ──
  function addReference() {
    if (!form.title.trim()) {
      alert("Title is required.");
      return;
    }
    setReferences((r) => [...r, { ...form, id: uid(), sourceType, url: cleanUrl(urlInput || form.url) }]);
    resetForm();
  }

  function removeReference(id: string) {
    setReferences((r) => r.filter((ref) => ref.id !== id));
  }

  function editReference(id: string) {
    const ref = references.find((r) => r.id === id);
    if (!ref) return;
    setForm(ref);
    setSourceType(ref.sourceType);
    setUrlInput(ref.url);
    setAutoFillStatus("idle");
    setAutoFillError("");
    setReferences((r) => r.filter((x) => x.id !== id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Bulk processing ──
  async function handleBulkProcess() {
    const urls = bulkInput.split("\n").map((s) => s.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setBulkStatus("loading");
    setBulkResults([]);
    setSelectedBulk(new Set());

    try {
      const res = await fetch("/api/referencing?bulk=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      const results: BulkResult[] = data.results || [];
      setBulkResults(results);
      setSelectedBulk(new Set(results.map((_, i) => i).filter((i) => !results[i].error)));
      setBulkStatus("done");
    } catch {
      setBulkStatus("error");
    }
  }

  function addSelectedBulk() {
    const newRefs: Reference[] = [];
    for (const idx of selectedBulk) {
      const r = bulkResults[idx];
      if (!r || r.error) continue;
      const dateStr = r.publicationDate ? formatDateForAPA(r.publicationDate) : "";
      const detectedType = (r.sourceType as SourceType) || "website";
      newRefs.push({
        id: uid(), sourceType: detectedType,
        authors: r.authors || "", title: r.title || "",
        siteName: r.siteName || r.publisher || "",
        publisher: r.publisher || r.siteName || "",
        journalName: r.journalName || "",
        volume: r.volume || "", issue: r.issue || "",
        pages: r.pages || "", doi: r.doi || "",
        year: dateStr.match(/^\d{4}/)?.[0] || "",
        date: dateStr, url: cleanUrl(r.url),
        accessedDate: todayFormatted(), edition: "", reportNumber: "", channel: "",
      });
    }
    if (newRefs.length > 0) {
      setReferences((prev) => [...prev, ...newRefs]);
      setBulkResults([]);
      setSelectedBulk(new Set());
      setBulkStatus("idle");
      setBulkInput("");
    }
  }

  function toggleBulkItem(idx: number) {
    setSelectedBulk((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  // ── Copy & Export ──
  async function copyAllReferences() {
    const text = references.map((r) => citationPlain(r)).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function exportAsTxt() {
    const header = `Reference List: ${currentTitle}\nGenerated: ${todayFormatted()}\n${"=".repeat(50)}\n\n`;
    const body = references.map((r, i) => `${i + 1}. ${citationPlain(r)}`).join("\n\n");
    const blob = new Blob([header + body], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${currentTitle.replace(/[^a-zA-Z0-9]/g, "_")}_references.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Render ──

  const fields = SOURCE_FIELDS[sourceType];

  return (
    <main className="min-h-screen bg-surface text-fg flex flex-col">
      <SiteHeader currentPage="school" />

      {/* Page content */}
      <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl text-fg mb-2 font-bold tracking-tight">
            <span className="text-accent">✦</span> Referencing Tool
          </h1>
          <p className="text-sm text-secondary">
            APA 7th edition — auto-fill from URLs or enter manually
          </p>
        </div>

        {/* ── List management ── */}
        <div className="bg-card border border-line rounded-2xl p-5 mb-6 card-shadow">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="Reference list title..."
              className="flex-1 min-w-[140px] sm:min-w-[200px] bg-input border border-line rounded-lg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent/50"
            />
            <button
              onClick={saveCurrentList}
              className="bg-accent-light hover:bg-accent/20 border border-accent/20 text-accent px-4 py-2.5 rounded-lg text-sm transition-colors font-medium shrink-0"
            >
              {saved ? "✓ Saved!" : "💾 Save"}
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowListDropdown(!showListDropdown)}
                className="bg-input hover:bg-gray-50 border border-line text-secondary px-4 py-2.5 rounded-lg text-sm transition-colors"
              >
                📂 Load ▾
              </button>
              {showListDropdown && (
                <div className="absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-2 bg-card border border-line rounded-xl p-2 w-64 shadow-xl z-10 max-w-[calc(100vw-2rem)]">
                  {savedLists.length === 0 ? (
                    <p className="text-sm text-muted p-3">No saved lists yet</p>
                  ) : (
                    savedLists.map((list) => (
                      <div key={list.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group">
                        <button
                          onClick={() => { loadList(list); setShowListDropdown(false); }}
                          className="text-sm text-secondary hover:text-fg text-left flex-1 truncate"
                        >
                          {list.title}
                          <span className="block text-[11px] text-muted">
                            {list.references.length} refs · {new Date(list.updatedAt).toLocaleDateString()}
                          </span>
                        </button>
                        <button
                          onClick={() => deleteList(list.id)}
                          className="text-xs text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={newList}
              className="bg-input hover:bg-gray-50 border border-line text-secondary px-4 py-2.5 rounded-lg text-sm transition-colors"
            >
              🆕 New
            </button>
          </div>
        </div>

        {/* ── Tabs: Single / Bulk ── */}
        <div className="mb-6 flex gap-1 bg-card border border-line rounded-2xl p-1 w-full sm:w-fit card-shadow">
          <button
            onClick={() => setTab("single")}
            className={`px-5 py-2.5 rounded-xl text-sm transition-all font-medium ${
              tab === "single"
                ? "bg-accent text-white shadow-sm"
                : "text-secondary hover:text-fg"
            }`}
          >
            Single Entry
          </button>
          <button
            onClick={() => setTab("bulk")}
            className={`px-5 py-2.5 rounded-xl text-sm transition-all font-medium ${
              tab === "bulk"
                ? "bg-accent text-white shadow-sm"
                : "text-secondary hover:text-fg"
            }`}
          >
            Bulk URLs
          </button>
        </div>

        {/* ── Single Entry Tab ── */}
        {tab === "single" && (
          <div className="bg-card border border-line rounded-2xl p-6 mb-6 card-shadow">
            {/* Source type selector */}
            <div className="mb-5">
              <label className="block text-xs text-secondary mb-2 uppercase tracking-wider font-medium">
                Source Type
              </label>
              <div className="flex flex-wrap gap-2">
                {SOURCE_TYPES.map((st) => (
                  <button
                    key={st.value}
                    onClick={() => changeSourceType(st.value)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all border ${
                      sourceType === st.value
                        ? "bg-accent-light text-accent border-accent/30 font-medium"
                        : "bg-input text-secondary border-line hover:border-gray-300"
                    }`}
                  >
                    {st.icon} {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* URL input + auto-fill */}
            {["website", "news", "journal", "youtube", "report"].includes(sourceType) && (
              <div className="mb-5">
                <label className="block text-xs text-secondary mb-2 uppercase tracking-wider font-medium">
                  URL (optional — auto-fill info)
                </label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAutoFill(); }}
                    placeholder="https://example.com/article"
                    className="flex-1 bg-input border border-line rounded-lg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent/50"
                  />
                  <button
                    onClick={handleAutoFill}
                    disabled={autoFillStatus === "loading"}
                    className="bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-normal sm:whitespace-nowrap font-medium"
                  >
                    {autoFillStatus === "loading" ? "⟳ Fetching..." : "⟳ Auto-fill"}
                  </button>
                </div>
                {autoFillStatus === "error" && (
                  <p className="mt-2 text-xs text-amber-500">⚠ {autoFillError} — fill in the fields below manually</p>
                )}
                {autoFillStatus === "done" && (
                  <p className="mt-2 text-xs text-emerald-600">✓ Auto-filled from URL — review and edit below</p>
                )}
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-5">
              {fields.map((field) => (
                <div key={field.key} className={field.key === "title" || field.key === "authors" ? "sm:col-span-2" : undefined}>
                  <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider font-medium">
                    {field.label}{field.required ? " *" : ""}
                  </label>
                  <input
                    type="text"
                    value={form[field.key] as string}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent/50 break-words"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider font-medium">
                  URL
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => updateField("url", e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent/50 break-words"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary mb-1.5 uppercase tracking-wider font-medium">
                  Accessed Date
                </label>
                <input
                  type="text"
                  value={form.accessedDate}
                  onChange={(e) => updateField("accessedDate", e.target.value)}
                  className="w-full bg-input border border-line rounded-lg px-4 py-2.5 text-sm text-fg focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>

            {/* Preview */}
            {form.title && (
              <div className="mb-5 p-4 bg-input border border-line rounded-xl">
                <p className="text-[11px] text-muted mb-2 uppercase tracking-wider font-medium">Preview</p>
                <p
                  className="text-sm text-fg leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: citationHtml({ ...form, sourceType, id: "", url: cleanUrl(urlInput || form.url) }),
                  }}
                />
              </div>
            )}

            {/* Add button */}
            <button
              onClick={addReference}
              disabled={!form.title.trim()}
              className="bg-accent hover:bg-[#6d28d9] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + Add to Reference List
            </button>

            {!form.title.trim() && (
              <p className="mt-2 text-xs text-muted">Fill in at least the title to add a reference</p>
            )}
          </div>
        )}

        {/* ── Bulk URLs Tab ── */}
        {tab === "bulk" && (
          <div className="bg-card border border-line rounded-2xl p-6 mb-6 card-shadow">
            <div className="mb-4">
              <label className="block text-xs text-secondary mb-2 uppercase tracking-wider font-medium">
                Paste URLs (one per line)
              </label>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={"https://example.com/article-1\nhttps://theguardian.com/news\nhttps://youtube.com/watch?v=xxx"}
                rows={6}
                className="w-full bg-input border border-line rounded-lg px-4 py-3 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent/50 resize-y"
              />
            </div>
            <button
              onClick={handleBulkProcess}
              disabled={bulkStatus === "loading" || !bulkInput.trim()}
              className="bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 font-medium"
            >
              {bulkStatus === "loading" ? "⟳ Processing..." : "⟳ Process URLs →"}
            </button>

            {/* Bulk results */}
            {bulkResults.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-secondary uppercase tracking-wider font-medium">
                    Results ({bulkResults.length} URLs)
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        const all = new Set<number>();
                        bulkResults.forEach((_, i) => { if (!bulkResults[i].error) all.add(i); });
                        setSelectedBulk(all);
                      }}
                      className="text-xs text-muted hover:text-secondary transition-colors"
                    >
                      Select all valid
                    </button>
                    <button onClick={() => setSelectedBulk(new Set())} className="text-xs text-muted hover:text-secondary transition-colors">
                      Clear
                    </button>
                  </div>
                </div>

                {bulkResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl mb-2 border transition-colors ${
                      result.error
                        ? "bg-gray-50 border-amber-200/50 opacity-60"
                        : selectedBulk.has(idx)
                        ? "bg-accent/5 border-accent/30"
                        : "bg-input border-line hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBulk.has(idx)}
                      onChange={() => toggleBulkItem(idx)}
                      disabled={!!result.error}
                      className="mt-1 accent-accent"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] uppercase px-2 py-0.5 rounded bg-gray-100 text-muted font-medium tracking-wider">
                          {result.sourceType || "website"}
                        </span>
                        {result.error && <span className="text-[11px] text-amber-500">⚠ Error</span>}
                      </div>
                      <p className="text-sm text-fg truncate font-medium">
                        {result.title || result.url || "Untitled"}
                      </p>
                      <p className="text-[11px] text-muted truncate max-w-full">
                        {result.authors ? `${result.authors} · ` : ""}{result.url}
                      </p>
                    </div>
                    {result.error && (
                      <span className="text-[11px] text-amber-500 shrink-0 break-words max-w-[120px]">
                        {result.error.length > 30 ? result.error.slice(0, 30) + "…" : result.error}
                      </span>
                    )}
                    {!result.error && result.title && (
                      <span className="text-[11px] text-emerald-600 shrink-0">✓</span>
                    )}
                  </div>
                ))}

                <button
                  onClick={addSelectedBulk}
                  disabled={selectedBulk.size === 0}
                  className="mt-4 bg-accent hover:bg-[#6d28d9] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  + Add Selected ({selectedBulk.size}) to List
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Reference List ── */}
        <div className="bg-card border border-line rounded-2xl p-6 mb-6 card-shadow">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-base text-fg font-bold tracking-tight">
              Reference List <span className="text-muted font-normal">({references.length})</span>
            </h2>
            {references.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={copyAllReferences}
                  className="bg-input hover:bg-gray-50 border border-line text-secondary px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {copied ? "✓ Copied!" : "📋 Copy All"}
                </button>
                <button
                  onClick={exportAsTxt}
                  className="bg-input hover:bg-gray-50 border border-line text-secondary px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  ⬇ Export .txt
                </button>
              </div>
            )}
          </div>

          {references.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted">No references yet. Add one using the form above.</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {references.map((ref, idx) => (
                <li
                  key={ref.id}
                  className="group bg-input border border-line rounded-xl p-4 hover:border-accent/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-accent font-medium mr-2">[{idx + 1}]</span>
                      <span className="text-[11px] uppercase px-2 py-0.5 rounded bg-gray-100 text-muted font-medium tracking-wider">
                        {SOURCE_TYPES.find((st) => st.value === ref.sourceType)?.label || ref.sourceType}
                      </span>
                      <p
                        className="mt-2 text-sm text-fg leading-relaxed break-words [overflow-wrap:anywhere]"
                        dangerouslySetInnerHTML={{ __html: citationHtml(ref) }}
                      />
                    </div>
                    <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => editReference(ref.id)}
                        className="text-xs text-muted hover:text-accent p-1.5 rounded-lg hover:bg-gray-100 transition-all"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeReference(ref.id)}
                        className="text-xs text-muted hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-all"
                        title="Remove"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ── Footer ── */}
        <p className="text-[11px] text-muted text-center pb-8">
          APA 7th edition · Data saved in your browser (localStorage)
        </p>
      </div>
    </main>
  );
}
