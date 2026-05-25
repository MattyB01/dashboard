"use client";

import { useState } from "react";
import "katex/dist/katex.min.css";
import katex from "katex";

const SACE_TOPICS = [
  { id: "diff-intro", label: "Differentiation (Introduction)", chapters: ["Topic 1"] },
  { id: "diff-apps", label: "Applications of Differentiation", chapters: ["Topic 2"] },
  { id: "integration", label: "Integration", chapters: ["Topic 3"] },
  { id: "integ-apps", label: "Applications of Integration", chapters: ["Topic 4"] },
  { id: "discrete-rv", label: "Discrete Random Variables", chapters: ["Topic 5"] },
  { id: "continuous-rv", label: "Continuous Random Variables", chapters: ["Topic 6"] },
  { id: "sampling-ci", label: "Sampling & Confidence Intervals", chapters: ["Topic 7"] },
  { id: "binomial", label: "Binomial Distribution", chapters: ["Topic 8"] },
];

interface Question {
  id: number;
  marks: number;
  question: string;
  parts: { label: string; text: string; marks: number }[];
  solution: string;
}

interface TestPlan {
  title: string;
  total_marks: number;
  time_allowed: string;
  topics: string[];
  outlines: { id: number; topic: string; marks: number; description: string }[];
}

interface TestData {
  title: string;
  total_marks: number;
  time_allowed: string;
  topics: string[];
  questions: Question[];
}

type Phase = "form" | "planning" | "generating" | "done" | "error";

// ===== KaTeX inline renderer =====
function MathText({ text }: { text: string }) {
  const parts: { type: "text" | "inline" | "display"; content: string }[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    const dd = remaining.indexOf("$$");
    if (dd !== -1) {
      const ddEnd = remaining.indexOf("$$", dd + 2);
      if (ddEnd !== -1) {
        if (dd > 0) parts.push({ type: "text" as const, content: remaining.slice(0, dd) });
        parts.push({ type: "display" as const, content: remaining.slice(dd + 2, ddEnd) });
        remaining = remaining.slice(ddEnd + 2);
        continue;
      }
    }
    const sd = remaining.indexOf("$");
    if (sd !== -1) {
      const sdEnd = remaining.indexOf("$", sd + 1);
      if (sdEnd !== -1 && remaining[sdEnd + 1] !== "$") {
        if (sd > 0) parts.push({ type: "text" as const, content: remaining.slice(0, sd) });
        parts.push({ type: "inline" as const, content: remaining.slice(sd + 1, sdEnd) });
        remaining = remaining.slice(sdEnd + 1);
        continue;
      }
    }
    parts.push({ type: "text" as const, content: remaining });
    break;
  }
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "text") return <span key={i} className="whitespace-pre-wrap">{part.content}</span>;
        try {
          const html = katex.renderToString(part.content, { throwOnError: false, displayMode: part.type === "display", output: "html" });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className={part.type === "display" ? "block my-2" : "inline"} />;
        } catch {
          return <span key={i}>{part.content}</span>;
        }
      })}
    </>
  );
}

// ===== KaTeX render to plain HTML string for PDF =====
function renderMathHTML(text: string): string {
  const parts: { type: string; content: string }[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    const dd = remaining.indexOf("$$");
    if (dd !== -1) {
      const ddEnd = remaining.indexOf("$$", dd + 2);
      if (ddEnd !== -1) {
        if (dd > 0) parts.push({ type: "text", content: remaining.slice(0, dd) });
        parts.push({ type: "display", content: remaining.slice(dd + 2, ddEnd) });
        remaining = remaining.slice(ddEnd + 2);
        continue;
      }
    }
    const sd = remaining.indexOf("$");
    if (sd !== -1) {
      const sdEnd = remaining.indexOf("$", sd + 1);
      if (sdEnd !== -1 && remaining[sdEnd + 1] !== "$") {
        if (sd > 0) parts.push({ type: "text", content: remaining.slice(0, sd) });
        parts.push({ type: "inline", content: remaining.slice(sd + 1, sdEnd) });
        remaining = remaining.slice(sdEnd + 1);
        continue;
      }
    }
    parts.push({ type: "text", content: remaining });
    break;
  }
  return parts.map((part) => {
    if (part.type === "text") return escapeHtml(part.content);
    try {
      return katex.renderToString(part.content, { throwOnError: false, displayMode: part.type === "display", output: "html" });
    } catch {
      return escapeHtml(part.content);
    }
  }).join("");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ===== Build SAT test HTML document =====
function buildSATHTML(testData: TestData, type: "test" | "solutions"): string {
  const isSolutions = type === "solutions";
  const pageTitle = isSolutions ? "Worked Solutions" : testData.title;

  let questionsHTML = "";
  for (const q of testData.questions) {
    const gridHeight = Math.max(30, q.marks * 5); // mm per question base
    let partsHTML = "";

    if (q.question.trim()) {
      partsHTML += `<p class="stem">${renderMathHTML(q.question)}</p>`;
    }

    for (const part of q.parts) {
      const partGridHeight = Math.max(20, part.marks * 8); // more space per mark
      partsHTML += `
        <div class="part-row">
          <span class="part-label">(${escapeHtml(part.label)})</span>
          <div class="part-content">
            <p class="part-text">${renderMathHTML(part.text)}</p>
            <div class="marks-badge">[${part.marks}]</div>
            <div class="grid-box" style="height: ${partGridHeight}mm;"></div>
          </div>
        </div>`;
    }

    if (isSolutions) {
      questionsHTML += `
        <div class="question-block">
          <div class="q-header">
            <span class="q-num">Question ${q.id}</span>
            <span class="q-marks">[${q.marks} marks]</span>
          </div>
          ${partsHTML ? `<div class="q-body">${partsHTML}</div>` : ""}
          <div class="solution-box">
            <div class="sol-label">Solution:</div>
            <div class="sol-content">${renderMathHTML(q.solution)}</div>
          </div>
        </div>`;
    } else {
      questionsHTML += `
        <div class="question-block">
          <div class="q-header">
            <span class="q-num">Question ${q.id}</span>
            <span class="q-marks">[${q.marks} marks]</span>
          </div>
          <div class="q-body">${partsHTML}</div>
        </div>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(pageTitle)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>
  @page { size: A4; margin: 20mm 25mm 20mm 25mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
    padding: 0;
  }
  .test-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    margin-bottom: 4mm;
    letter-spacing: 1pt;
  }
  .test-info {
    text-align: center;
    font-size: 10pt;
    margin-bottom: 6mm;
    color: #333;
  }
  .instructions {
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    padding: 3mm 0;
    margin-bottom: 6mm;
    font-size: 10pt;
  }
  .instructions p { margin: 1mm 0; }
  .question-block {
    margin-bottom: 8mm;
    page-break-inside: avoid;
  }
  .q-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 1px solid #999;
    padding-bottom: 1mm;
    margin-bottom: 3mm;
  }
  .q-num { font-weight: bold; font-size: 12pt; }
  .q-marks { font-size: 10pt; color: #555; }
  .stem { margin-bottom: 3mm; font-size: 11pt; }
  .part-row {
    display: flex;
    gap: 4mm;
    margin-bottom: 2mm;
  }
  .part-label {
    font-weight: bold;
    min-width: 10mm;
    font-size: 10pt;
    color: #333;
  }
  .part-content {
    flex: 1;
  }
  .part-text {
    font-size: 11pt;
    margin-bottom: 1mm;
  }
  .marks-badge {
    text-align: right;
    font-size: 9pt;
    color: #888;
    margin-bottom: 1mm;
  }
  /* 5mm light gray grid for working space - uses PNG tile for reliable printing */
  .grid-box {
    width: 100%;
    border: 1px solid #bbb;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAJElEQVR4nGO8cuXKfwZqAmobyERNw0YNHDVw1MBRA0cNpKGBAFxIBxzImRLqAAAAAElFTkSuQmCC');
    background-size: 20px 20px;
    background-repeat: repeat;
    background-position: 0 0;
    margin: 2mm 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .solution-box {
    margin-top: 4mm;
    padding: 3mm;
    background: #f9f9f9;
    border-left: 3px solid #666;
  }
  .sol-label {
    font-weight: bold;
    font-size: 10pt;
    margin-bottom: 1mm;
    color: #333;
  }
  .sol-content {
    font-size: 10pt;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .sol-content .katex { font-size: 1.05em; }
  .katex { font-size: 1.1em; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  ${isSolutions ? "" : `
  <div class="test-title">${escapeHtml(testData.title)}</div>
  <div class="test-info">
    Total: ${testData.total_marks} marks &nbsp;|&nbsp; Time: ${escapeHtml(testData.time_allowed)}
  </div>
  <div class="instructions">
    <p><strong>Instructions:</strong></p>
    <p>• Answer all questions in the space provided.</p>
    <p>• Show all working for full marks.</p>
    <p>• Approved calculators may be used.</p>
  </div>
  `}
  ${isSolutions ? `<div class="test-title">${escapeHtml(testData.title)} — Worked Solutions</div>` : ""}
  ${questionsHTML}
<script>
  window.onload = function() { setTimeout(function() { window.print(); }, 500); };
</script>
</body>
</html>`;
}

function downloadSAT(doc: string) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) { alert("Please allow pop-ups to download the PDF."); return; }
  w.document.write(doc);
  w.document.close();
}

// ===== Main component =====
export default function MathsTestGenerator() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("form");
  const [testData, setTestData] = useState<TestData | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });

  function toggleTopic(id: string) {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function generateTest() {
    if (selectedTopics.length === 0) return;
    setError("");
    setTestData(null);
    const topicLabels = selectedTopics.map((id) => SACE_TOPICS.find((t) => t.id === id)?.label || id);

    try {
      setPhase("planning");
      setProgress({ current: 0, total: 0, message: "Planning test structure..." });

      const planRes = await fetch("/api/maths-generator?step=plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: topicLabels }),
      });
      if (!planRes.ok) throw new Error(await safeError(planRes));
      const planData = await planRes.json();
      const plan: TestPlan = planData.plan;
      const numQuestions = plan.outlines.length;

      setPhase("generating");
      const questions: Question[] = [];
      for (let i = 0; i < numQuestions; i++) {
        setProgress({ current: i + 1, total: numQuestions, message: `Generating question ${i + 1} of ${numQuestions}...` });
        let qData: any = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const qRes = await fetch("/api/maths-generator?step=question", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan, questionIndex: i, previousQuestions: questions }),
            });
            if (!qRes.ok) { if (attempt === 1) throw new Error(await safeError(qRes)); continue; }
            qData = await qRes.json();
            break;
          } catch (e: any) { if (attempt === 1) throw e; await new Promise(r => setTimeout(r, 1000)); }
        }
        questions.push(qData.question);
      }

      setTestData({
        title: plan.title,
        total_marks: questions.reduce((s, q) => s + q.marks, 0),
        time_allowed: plan.time_allowed,
        topics: plan.topics,
        questions,
      });
      setPhase("done");
    } catch (e: any) {
      setError(e.message || "Failed to generate test. Try again.");
      setPhase("error");
    }
  }

  async function safeError(res: Response): Promise<string> {
    try { const err = await res.json(); return err.error || `Error ${res.status}`; }
    catch { try { return await res.text() || `Error ${res.status}`; } catch { return `Error ${res.status}`; } }
  }

  return (
    <main className="min-h-screen bg-surface text-fg flex flex-col">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-secondary hover:text-fg transition-colors">Home</a>
          <a href="/school" className="text-xs text-secondary hover:text-fg transition-colors">School</a>
          <span className="text-xs text-accent border-b border-accent">Maths Test Generator</span>
        </div>
      </header>

      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {phase === "form" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl mb-2"><span className="text-accent">∫</span> Maths Test Generator</h1>
              <p className="text-sm text-secondary">Select topics to include in your SACE Stage 2 Maths Methods practice test</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {SACE_TOPICS.map((topic) => {
                const selected = selectedTopics.includes(topic.id);
                return (
                  <button key={topic.id} onClick={() => toggleTopic(topic.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${selected ? "bg-accent-light border-accent text-accent" : "bg-card card-shadow border-line text-secondary hover:border-gray-300"}`}>
                    <div className="text-sm">{topic.label}</div>
                    <div className="text-[11px] mt-1 opacity-60">{topic.chapters.join(", ")}</div>
                  </button>
                );
              })}
            </div>
            <button onClick={generateTest} disabled={selectedTopics.length === 0}
              className={`w-full py-4 rounded-xl text-sm transition-all ${selectedTopics.length === 0 ? "bg-gray-100 text-muted cursor-not-allowed" : "bg-accent text-white hover:bg-[#6d28d9]"}`}>
              Generate Test
            </button>
            {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl"><p className="text-sm text-red-500">{error}</p></div>}
          </>
        )}

        {(phase === "planning" || phase === "generating") && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-accent-light border border-accent/20 flex items-center justify-center mb-6 animate-pulse">
              <span className="text-2xl text-accent">∫</span>
            </div>
            <p className="text-sm text-fg mb-4">{progress.message}</p>
            {phase === "generating" && progress.total > 0 && (
              <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
            )}
            <p className="text-xs text-muted">
              {phase === "planning" ? "Designing test structure..." : `Question ${progress.current} of ${progress.total}`}
            </p>
          </div>
        )}

        {phase === "done" && testData && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <button onClick={() => setPhase("form")}
                className="text-xs text-secondary hover:text-fg transition-colors">← New test</button>
              <div className="flex gap-3">
                <button onClick={() => downloadSAT(buildSATHTML(testData, "test"))}
                  className="px-4 py-2 bg-accent text-white rounded-xl text-xs hover:bg-[#6d28d9] transition-colors">
                  Download Test PDF
                </button>
                <button onClick={() => downloadSAT(buildSATHTML(testData, "solutions"))}
                  className="px-4 py-2 bg-gray-100 text-fg rounded-xl text-xs hover:bg-gray-50 transition-colors border border-line">
                  Download Solutions PDF
                </button>
              </div>
            </div>

            {/* Web preview */}
            <div className="bg-card card-shadow border border-line rounded-2xl p-6 lg:p-8 mb-6">
              <h1 className="text-xl text-fg mb-2">{testData.title}</h1>
              <p className="text-xs text-secondary mb-4">Total: {testData.total_marks} marks · Time: {testData.time_allowed} · {testData.topics.join(", ")}</p>
              <div className="space-y-8">
                {testData.questions.map((q) => (
                  <div key={q.id} className="border-t border-line pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm text-fg">Question {q.id}</h3>
                      <span className="text-[11px] text-secondary">[{q.marks} marks]</span>
                    </div>
                    {q.question && <div className="text-sm text-gray-700 leading-relaxed mb-4"><MathText text={q.question} /></div>}
                    <div className="space-y-2">
                      {q.parts.map((part) => (
                        <div key={part.label} className="flex items-start gap-3">
                          <span className="text-xs text-accent mt-0.5 shrink-0">({part.label})</span>
                          <div className="text-sm text-gray-700 leading-relaxed"><MathText text={part.text} /></div>
                          <span className="text-[11px] text-muted shrink-0 ml-auto">[{part.marks}]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Web solutions preview */}
            <div className="bg-card card-shadow border border-line rounded-2xl p-6 lg:p-8">
              <h2 className="text-lg text-fg mb-6">✦ Worked Solutions</h2>
              <div className="space-y-6">
                {testData.questions.map((q) => (
                  <div key={q.id} className="border-t border-line pt-4">
                    <h3 className="text-sm text-accent mb-3">Question {q.id} [{q.marks} marks]</h3>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"><MathText text={q.solution} /></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {phase === "error" && (
          <div className="text-center py-12">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button onClick={() => setPhase("form")} className="text-xs text-accent hover:text-[#b99cfb]">← Try again</button>
          </div>
        )}
      </div>
    </main>
  );
}
