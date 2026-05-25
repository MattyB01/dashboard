"use client";

import { useState } from "react";

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

interface TestData {
  title: string;
  total_marks: number;
  time_allowed: string;
  topics: string[];
  questions: Question[];
}

type Page = "form" | "test" | "solutions" | "error";

export default function MathsTestGenerator() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState<Page>("form");
  const [testData, setTestData] = useState<TestData | null>(null);
  const [error, setError] = useState("");

  function toggleTopic(id: string) {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function generateTest() {
    if (selectedTopics.length === 0) return;
    setGenerating(true);
    setError("");
    setTestData(null);
    setPage("form");

    try {
      const res = await fetch("/api/maths-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: selectedTopics.map(
            (id) => SACE_TOPICS.find((t) => t.id === id)?.label || id
          ),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setTestData(data.test);
      setPage("test");
    } catch (e: any) {
      setError(e.message || "Failed to generate test. Try again.");
      setPage("error");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadPDF(type: "test-pdf" | "solutions-pdf") {
    if (!testData) return;
    try {
      const res = await fetch(`/api/maths-generator?format=${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: selectedTopics.map(
            (id) => SACE_TOPICS.find((t) => t.id === id)?.label || id
          ),
        }),
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "test-pdf" ? "maths-test.pdf" : "maths-test-solutions.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError("Download failed. Try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#0e0e16] text-[#e8e8f0] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e1e30] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono">
            Home
          </a>
          <a href="/school" className="text-xs text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono">
            School
          </a>
          <span className="text-xs text-[#a78bfa] font-mono border-b border-[#a78bfa]">
            Maths Test Generator
          </span>
        </div>

        <details className="sm:hidden relative">
          <summary className="list-none cursor-pointer p-2 hover:bg-[#1e1e30] rounded-lg">
            <div className="w-5 h-0.5 bg-[#8888a0] mb-1"></div>
            <div className="w-5 h-0.5 bg-[#8888a0] mb-1"></div>
            <div className="w-5 h-0.5 bg-[#8888a0]"></div>
          </summary>
          <div className="absolute right-0 top-full mt-2 bg-[#16161f] border border-[#1e1e30] rounded-xl p-4 w-48 shadow-2xl flex flex-col gap-3">
            <a href="/" className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono">Home</a>
            <a href="/school" className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono">School</a>
            <span className="text-sm text-[#a78bfa] font-mono">Maths Test Generator</span>
          </div>
        </details>
      </header>

      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {page === "form" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-mono mb-2">
                <span className="text-[#a78bfa]">∫</span> Maths Test Generator
              </h1>
              <p className="text-sm text-[#8888a0] font-mono">
                Select topics to include in your SACE Stage 2 Maths Methods practice test
              </p>
            </div>

            {/* Topic Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {SACE_TOPICS.map((topic) => {
                const selected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`text-left p-4 rounded-xl border transition-all font-mono ${
                      selected
                        ? "bg-[#a78bfa]/10 border-[#a78bfa] text-[#a78bfa]"
                        : "bg-[#16161f] border-[#1e1e30] text-[#8888a0] hover:border-[#555570]"
                    }`}
                  >
                    <div className="text-sm">{topic.label}</div>
                    <div className="text-[11px] mt-1 opacity-60">{topic.chapters.join(", ")}</div>
                  </button>
                );
              })}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateTest}
              disabled={selectedTopics.length === 0 || generating}
              className={`w-full py-4 rounded-xl font-mono text-sm transition-all ${
                selectedTopics.length === 0 || generating
                  ? "bg-[#1e1e30] text-[#555570] cursor-not-allowed"
                  : "bg-[#a78bfa] text-[#0e0e16] hover:bg-[#b99cfb]"
              }`}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">●</span> Generating test...
                </span>
              ) : (
                "Generate Test"
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-xl">
                <p className="text-sm text-red-400 font-mono">{error}</p>
              </div>
            )}
          </>
        )}

        {page === "test" && testData && (
          <>
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <button
                onClick={() => setPage("form")}
                className="text-xs text-[#8888a0] hover:text-[#e8e8f0] transition-colors font-mono"
              >
                ← Back to topics
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => downloadPDF("test-pdf")}
                  className="px-4 py-2 bg-[#a78bfa] text-[#0e0e16] rounded-xl text-xs font-mono hover:bg-[#b99cfb] transition-colors"
                >
                  Download Test PDF
                </button>
                <button
                  onClick={() => downloadPDF("solutions-pdf")}
                  className="px-4 py-2 bg-[#1e1e30] text-[#e8e8f0] rounded-xl text-xs font-mono hover:bg-[#2a2a40] transition-colors border border-[#333350]"
                >
                  Download Solutions PDF
                </button>
              </div>
            </div>

            {/* Test Preview */}
            <div className="bg-[#16161f] border border-[#1e1e30] rounded-2xl p-6 lg:p-8 mb-6">
              <h1 className="text-xl font-mono text-[#e8e8f0] mb-2">{testData.title}</h1>
              <p className="text-xs text-[#8888a0] font-mono mb-4">
                Total: {testData.total_marks} marks &middot; Time: {testData.time_allowed} &middot;{" "}
                {testData.topics.join(", ")}
              </p>

              <div className="border-t border-[#1e1e30] pt-4 mb-4">
                <p className="text-xs text-[#8888a0] font-mono">Instructions:</p>
                <ul className="text-xs text-[#8888a0] font-mono mt-1 space-y-1">
                  <li>- Answer all questions in the space provided.</li>
                  <li>- Show all working for full marks.</li>
                  <li>- Approved calculators may be used.</li>
                </ul>
              </div>

              <div className="space-y-8">
                {testData.questions.map((q) => (
                  <div key={q.id} className="border-t border-[#1e1e30] pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-mono text-[#e8e8f0]">
                        Question {q.id}
                      </h3>
                      <span className="text-[11px] text-[#8888a0] font-mono">
                        [{q.marks} marks]
                      </span>
                    </div>

                    <p className="text-sm text-[#c8c8d8] font-mono leading-relaxed mb-4 whitespace-pre-wrap">
                      {q.question}
                    </p>

                    <div className="space-y-2">
                      {q.parts.map((part) => (
                        <div key={part.label} className="flex items-start gap-3">
                          <span className="text-xs text-[#a78bfa] font-mono mt-0.5 shrink-0">
                            ({part.label})
                          </span>
                          <p className="text-sm text-[#c8c8d8] font-mono leading-relaxed">
                            {part.text}
                          </p>
                          <span className="text-[11px] text-[#555570] font-mono shrink-0 ml-auto">
                            [{part.marks}]
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Working space */}
                    <div className="mt-4 border border-dashed border-[#1e1e30] rounded-lg" style={{ height: `${Math.max(40, q.marks * 8)}px` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions section */}
            <div className="bg-[#16161f] border border-[#1e1e30] rounded-2xl p-6 lg:p-8">
              <h2 className="text-lg font-mono text-[#e8e8f0] mb-6">
                ✦ Worked Solutions
              </h2>
              <div className="space-y-6">
                {testData.questions.map((q) => (
                  <div key={q.id} className="border-t border-[#1e1e30] pt-4">
                    <h3 className="text-sm font-mono text-[#a78bfa] mb-3">
                      Question {q.id} [{q.marks} marks]
                    </h3>
                    <p className="text-sm text-[#c8c8d8] font-mono leading-relaxed whitespace-pre-wrap">
                      {q.solution}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {page === "error" && (
          <div className="text-center py-12">
            <p className="text-red-400 font-mono text-sm mb-4">{error}</p>
            <button
              onClick={() => setPage("form")}
              className="text-xs text-[#a78bfa] hover:text-[#b99cfb] font-mono"
            >
              ← Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
