import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const API_KEY = process.env.OPENCODE_API_KEY || "";
const API_BASE = process.env.OPENCODE_BASE_URL || "https://opencode.ai/zen/go/v1";
const MODEL = process.env.OPENCODE_MODEL || "minimax-m2.7";

interface QuestionPart {
  label: string;
  text: string;
  marks: number;
}

interface Question {
  id: number;
  marks: number;
  question: string;
  parts: QuestionPart[];
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

/** Call the opencode AI API with a prompt, return the raw text response */
async function callAI(messages: { role: string; content: string }[], maxTokens = 8000): Promise<string> {
  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      reasoning_effort: "low",
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    let errBody = "";
    try {
      const errJson = await response.json();
      errBody = errJson.error?.message || JSON.stringify(errJson).slice(0, 200);
    } catch {
      errBody = await response.text().catch(() => "");
    }
    throw new Error(`API error ${response.status}: ${errBody.slice(0, 200)}`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    const text = await response.text().catch(() => "");
    throw new Error(`AI returned non-JSON response: ${text.slice(0, 200)}`);
  }

  const msg = data.choices?.[0]?.message || {};
  const text = msg.content || "";
  if (!text) {
    throw new Error("Empty response from AI model (model may have timed out)");
  }
  return text;
}

/** Extract JSON from AI response text */
function extractJSON(text: string): any {
  if (!text || text.trim().length === 0) {
    throw new Error("Empty response from AI model");
  }

  // Strategy 1: Strip markdown code fences
  let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/g, '').trim();

  // Strategy 2: Find the outermost { ... } structure
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Strategy 3: Try parsing with common fixes
  const attemptParse = (str: string): any => {
    try { return JSON.parse(str); } catch (_) {}
    try {
      const fixed = str.replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(fixed);
    } catch (_) {}
    try {
      const fixed = str
        .replace(/\\(['"])/g, '$1')
        .replace(/\\n/g, '\\\\n');
      return JSON.parse(fixed);
    } catch (_) {}
    return null;
  };

  const parsed = attemptParse(cleaned);
  if (!parsed) {
    const snippet = text.substring(0, 300).replace(/\n/g, '\\n');
    throw new Error(`Failed to parse AI response as JSON. Snippet: ${snippet}`);
  }

  return parsed;
}

// =================== STEP 1: PLAN THE TEST ===================
async function handlePlan(topics: string[]): Promise<TestPlan> {
  const prompt = `You are an expert SACE Stage 2 Maths Methods examiner. Plan a SAT-style test covering these topics: ${topics.join(", ")}.

Create a test plan with 5-8 questions. Return ONLY valid JSON with this exact structure:
{
  "title": "MATHEMATICS METHODS - STAGE 2 - TOPIC TEST",
  "total_marks": 70,
  "time_allowed": "120 min",
  "outlines": [
    {
      "id": 1,
      "topic": "Differentiation",
      "marks": 8,
      "description": "Find derivative of a function using product rule and chain rule"
    }
  ]
}

Each outline should cover a different aspect of the selected topics. Mix these question types across the test:
- Pure computation: "Find the derivative of ..." (chain rule, product rule, quotient rule)
- Show that / prove: "Show that f'(x) = ..."
- First principles: "Find the derivative from first principles"
- Evaluate at a point: "Find f'(2) in its simplest form"
- Graph interpretation: "Draw a line on the graph..." or "Use the graph to..."
- Average rate of change problems
- "Hence" style linked multi-part questions
- Trigonometric differentiation where applicable
- Applied/worded problems (real-world context) - only 1-2 of these

Include AT MOST 1-2 worded/applied questions. Most should be pure mathematical questions similar to real SACE tests. Total marks should be 60-80.

IMPORTANT: Return ONLY valid JSON, no other text.`;

  const response = await callAI([
    { role: "system", content: "You are an expert SACE Stage 2 Maths Methods examiner and test planner. Always respond with ONLY valid JSON." },
    { role: "user", content: prompt }
  ], 6000);

  const parsed = extractJSON(response);

  return {
    title: parsed.title || "Mathematics Methods - Stage 2 - Topic Test",
    total_marks: parsed.total_marks || 60,
    time_allowed: parsed.time_allowed || "100 min",
    topics,
    outlines: (parsed.outlines || []).map((o: any, i: number) => ({
      id: o.id || i + 1,
      topic: o.topic || topics[0] || "",
      marks: o.marks || 5,
      description: o.description || "",
    })),
  };
}

// =================== STEP 2: GENERATE ONE QUESTION ===================
async function handleQuestion(plan: TestPlan, questionIndex: number, previousQuestions: Question[]): Promise<Question> {
  const outline = plan.outlines[questionIndex];
  if (!outline) throw new Error(`Question index ${questionIndex} out of range`);

  const prevContext = previousQuestions.length > 0
    ? `\n\nQuestions already generated (do NOT duplicate or overlap):\n${previousQuestions.map(q =>
        `Question ${q.id}: ${q.question.substring(0, 100)}... [${q.marks} marks - ${q.parts.map(p => p.label).join(", ")}]`
      ).join("\n")}`
    : "";

  const prompt = `You are generating Question ${outline.id} of ${plan.outlines.length} for a SACE Stage 2 Maths Methods test.

Test title: ${plan.title}
Topics: ${plan.topics.join(", ")}

Question ${outline.id}: ${outline.description}
Topic: ${outline.topic}
Marks: ${outline.marks}

Create a COMPLETELY ORIGINAL question. Do NOT copy from textbooks. Create fresh numbers, functions, and contexts.
- Include 2-4 parts labeled (a), (b), (c), etc.
- Each part should have individual marks that sum to ${outline.marks}
- Mix of question types: some theoretical/analytical (solving, derivatives, integrals), some applied/worded (real-world contexts, optimization, rates of change), and where applicable include graphing/sketching questions${prevContext}

CRITICAL FORMAT RULE: The "question" field must contain ONLY the introductory stem/common context (e.g. "Consider the function $f(x) = x^3 - 3x^2 + 2$." or "Find the derivative of the following."). Do NOT list the part questions in the "question" field. Each part's specific instruction goes ONLY in the "parts" array.

QUESTION TYPE GUIDELINES - pick the style that matches the outline description:
- Pure computation: "Find $\frac{dy}{dx}$ for $y = \dots$", "Differentiate $f(x) = \dots$"
- Show that: "Show that $f'(x) = \dots$" where the answer is given, student must show working
- First principles: "Find $f'(x)$ from first principles given $f(x) = \dots$"
- Evaluate: "Find $f'(2)$ in its simplest form"
- Graph: "Draw a line on the graph below that represents..." (include a brief graph description)
- Hence: Part (a) finds something, part (b) uses it: "Hence, find..."
- Trigonometric: Differentiate $\sin$, $\cos$, $\tan$ functions
- Applied: Real-world context (optimization, rates) - use SPARINGLY (max 1-2 per test)

Return ONLY valid JSON with this structure:
{
  "id": ${outline.id},
  "marks": ${outline.marks},
  "question": "Only the common stem/introductory text. Never list part questions here.",
  "parts": [
    { "label": "a", "text": "Specific instruction for part (a)", "marks": 3 },
    { "label": "b", "text": "Specific instruction for part (b)", "marks": 3 }
  ],
  "solution": "Full step-by-step worked solution for all parts. Show all working as a student would write it using LaTeX math notation."
}

For mathematical expressions use proper LaTeX notation:
- Inline math: wrap with $...$ like $x^2$, $f'(x)$, $\frac{dy}{dx}$
- Fractions: $\frac{x+1}{x-2}$
- Powers: $x^2$, $x^3$, $x^{\frac{1}{2}}$ for square root
- Greek letters: $\mu$, $\sigma$, $\pi$, $\theta$
- Symbols: $\infty$, $\leq$, $\geq$, $\approx$, $\neq$, $\rightarrow$, $\Rightarrow$
- Integrals: $\int_{a}^{b} f(x) \, dx$
- Trigonometric: $\sin(x)$, $\cos(x)$, $\tan(x)$, $\ln(x)$, $\log(x)$
- Square root: $\sqrt{x}$, $\sqrt[3]{x}$
- Display math: use $$...$$ for larger expressions like $$\frac{d}{dx}\left(x^2\right)=2x$$

Put ALL math inside $...$ or $$...$$ delimiters. Do NOT use unicode math symbols outside of these delimiters.

IMPORTANT: Return ONLY valid JSON, no other text.`;

  const response = await callAI([
    {
      role: "system",
      content: "You are an expert SACE Stage 2 Maths Methods examiner creating original test questions. Always respond with ONLY valid JSON."
    },
    { role: "user", content: prompt }
  ], 10000);

  const parsed = extractJSON(response);

  return {
    id: parsed.id || outline.id,
    marks: parsed.marks || outline.marks,
    question: parsed.question || outline.description,
    parts: (parsed.parts || []).map((p: any) => ({
      label: p.label || "",
      text: p.text || "",
      marks: p.marks || 0,
    })),
    solution: parsed.solution || "",
  };
}

// =================== PDF GENERATION ===================
async function generatePDFs(testData: TestData): Promise<{ testPdf: Uint8Array; solPdf: Uint8Array }> {
  const testDoc = await PDFDocument.create();
  const solDoc = await PDFDocument.create();

  const font = await testDoc.embedFont(StandardFonts.Courier);
  const solFont = await solDoc.embedFont(StandardFonts.Courier);
  const solFontBold = await solDoc.embedFont(StandardFonts.CourierBold);

  function drawWrappedText(
    doc: PDFDocument,
    page: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number,
    font: any,
    lineHeight: number,
  ): number {
    const lines: string[] = [];
    const paragraphs = text.split("\n");

    for (const para of paragraphs) {
      if (para.trim() === "") { lines.push(""); continue; }
      const words = para.split(" ");
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }

    for (const line of lines) {
      if (y < 40) {
        page = doc.addPage();
        y = 750;
      }
      page.drawText(line, { x, y, size: fontSize, font });
      y -= lineHeight;
    }
    return y;
  }

  // Test PDF
  let page = testDoc.addPage([612, 792]);
  const margin = 50;
  let y = 740;
  const maxW = 512;

  page.drawText(testData.title, { x: margin, y, size: 16, font });
  y -= 24;
  page.drawText(`Total: ${testData.total_marks} marks  |  Time: ${testData.time_allowed}`, {
    x: margin, y, size: 10, font
  });
  y -= 20;
  page.drawText(`Topics: ${testData.topics.join(", ")}`, { x: margin, y, size: 9, font });
  y -= 24;
  page.drawText("Instructions:", { x: margin, y, size: 10, font });
  y -= 14;
  page.drawText("- Answer all questions in the space provided.", { x: margin + 10, y, size: 9, font });
  y -= 12;
  page.drawText("- Show all working for full marks.", { x: margin + 10, y, size: 9, font });
  y -= 12;
  page.drawText("- Approved calculators may be used.", { x: margin + 10, y, size: 9, font });
  y -= 24;
  page.drawLine({ start: { x: margin, y }, end: { x: 562, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 20;

  for (const q of testData.questions) {
    if (y < 80) { page = testDoc.addPage(); y = 740; }
    page.drawText(`Question ${q.id}`, { x: margin, y, size: 12, font });
    page.drawText(`[${q.marks} marks]`, { x: margin + 120, y, size: 10, font });
    y -= 16;
    y = drawWrappedText(testDoc, page, q.question, margin + 5, y, maxW - 5, 9, font, 13);
    y -= 8;
    for (const part of q.parts) {
      if (y < 60) { page = testDoc.addPage(); y = 740; }
      page.drawText(`(${part.label})`, { x: margin + 5, y, size: 9, font });
      y = drawWrappedText(testDoc, page, part.text, margin + 20, y, maxW - 25, 9, font, 13);
      page.drawText(`[${part.marks}]`, { x: margin + maxW - 30, y: y + 3, size: 8, font });
      y -= 10;
    }
    y -= 30;
  }

  // Solutions PDF
  let solPage = solDoc.addPage([612, 792]);
  y = 740;

  solPage.drawText(`${testData.title} - WORKED SOLUTIONS`, { x: margin, y, size: 16, font: solFontBold });
  y -= 24;
  solPage.drawText(`Total: ${testData.total_marks} marks`, { x: margin, y, size: 10, font: solFont });
  y -= 24;

  for (const q of testData.questions) {
    if (y < 60) { solPage = solDoc.addPage(); y = 740; }
    solPage.drawText(`Question ${q.id} [${q.marks} marks]`, { x: margin, y, size: 12, font: solFontBold });
    y -= 16;
    y = drawWrappedText(solDoc, solPage, q.solution, margin + 5, y, maxW - 5, 9, solFont, 13);
    y -= 16;
  }

  return {
    testPdf: await testDoc.save(),
    solPdf: await solDoc.save(),
  };
}

// =================== MAIN HANDLER ===================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const step = request.nextUrl.searchParams.get("step") || "plan";

    if (step === "plan") {
      const topics: string[] = body.topics || [];
      if (topics.length === 0) {
        return NextResponse.json({ error: "At least one topic is required" }, { status: 400 });
      }
      const plan = await handlePlan(topics);
      return NextResponse.json({ ok: true, plan });

    } else if (step === "question") {
      const plan: TestPlan = body.plan;
      const questionIndex: number = body.questionIndex;
      const previousQuestions: Question[] = body.previousQuestions || [];

      if (!plan || questionIndex === undefined) {
        return NextResponse.json({ error: "Missing plan or questionIndex" }, { status: 400 });
      }
      if (questionIndex < 0 || questionIndex >= plan.outlines.length) {
        return NextResponse.json({ error: `Invalid question index ${questionIndex}, max ${plan.outlines.length - 1}` }, { status: 400 });
      }

      const question = await handleQuestion(plan, questionIndex, previousQuestions);
      return NextResponse.json({ ok: true, question, questionIndex, total: plan.outlines.length });

    } else if (step === "pdf") {
      const testData: TestData = body.testData;
      const format = request.nextUrl.searchParams.get("format") || "test-pdf";

      if (!testData || !testData.questions) {
        return NextResponse.json({ error: "Missing test data" }, { status: 400 });
      }

      const pdfs = await generatePDFs(testData);

      if (format === "solutions-pdf") {
        return new NextResponse(Buffer.from(pdfs.solPdf), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="maths-test-solutions.pdf"`,
          },
        });
      }

      return new NextResponse(Buffer.from(pdfs.testPdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="maths-test.pdf"`,
        },
      });

    } else {
      return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Maths generator error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate test" },
      { status: 500 }
    );
  }
}
