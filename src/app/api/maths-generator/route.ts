import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const API_KEY = process.env.OPENCODE_API_KEY || "";
const API_BASE = process.env.OPENCODE_BASE_URL || "https://opencode.ai/zen/go/v1";
const MODEL = process.env.OPENCODE_MODEL || "deepseek-v4-flash";

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

function buildPrompt(topics: string[]): string {
  return `You are an expert SACE Stage 2 Maths Methods examiner. Generate a SAT-style test.

Topics to cover: ${topics.join(", ")}

Create a test in the exact SACE SAT format with:
- A title like "MATHEMATICS METHODS - STAGE 2 - TOPIC TEST"
- Total marks (60-80 marks)
- Time allowed: 60 min per ~30 marks
- Mix of question types:
  * Theoretical/analytical (finding derivatives, stationary points, integrals, solving equations, graphing)
  * Applied/worded problems (optimization, rates of change, probability scenarios, real-world contexts)
  * Proof/conjecture questions
  * Short answer (1-3 marks) and extended response (4-13 marks)

Each question should have:
- A clear stem/question text
- Multiple parts labeled (a), (b), (c), etc. with individual marks
- Full worked solution (step-by-step as a student would write it)

IMPORTANT: Generate COMPLETELY ORIGINAL questions. Do NOT copy from any textbook. Create new numbers, functions, and contexts.

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "title": "Test title",
  "total_marks": 60,
  "time_allowed": "100 min",
  "topics": ["topics covered"],
  "questions": [
    {
      "id": 1,
      "marks": 7,
      "question": "Full question text with any equations/expressions shown clearly",
      "parts": [
        { "label": "a", "text": "Part a text", "marks": 3 },
        { "label": "b", "text": "Part b text", "marks": 2 },
        { "label": "c", "text": "Part c text", "marks": 2 }
      ],
      "solution": "Full step-by-step worked solution for all parts"
    }
  ]
}

For mathematical expressions, use plain text with these conventions:
- Powers: x^2, x^3, x^(1/2) for square root
- Fractions: (x+1)/(x-2)
- Derivatives: f'(x), d/dx
- Integrals: ∫ from a to b
- Greek letters: mu, sigma, pi, theta
- Inequalities: <=, >=, <, >, !=
- Infinity: infinity
- Use unicode: ×, ÷, ±, √, π, θ, Δ, →, ⇒, ∫, ∑, ≤, ≥, ≈`;
}

async function generateTest(topics: string[]): Promise<TestData> {
  const prompt = buildPrompt(topics);

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert SACE Stage 2 Mathematics Methods examiner and test writer. You generate original, high-quality SAT-style assessments. Always respond with ONLY valid JSON, no other text."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 16000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Extract JSON from response (handle markdown-wrapped JSON)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    title: parsed.title || "Mathematics Methods Test",
    total_marks: parsed.total_marks || 60,
    time_allowed: parsed.time_allowed || "100 min",
    topics: parsed.topics || topics,
    questions: parsed.questions || [],
  };
}

async function generatePDFs(testData: TestData): Promise<{ testPdf: Uint8Array; solPdf: Uint8Array }> {
  // Create Test PDF
  const testDoc = await PDFDocument.create();
  const solDoc = await PDFDocument.create();

  const font = await testDoc.embedFont(StandardFonts.Courier);
  const solFont = await solDoc.embedFont(StandardFonts.Courier);
  const solFontBold = await solDoc.embedFont(StandardFonts.CourierBold);

  // --- HELPER: draw text with wrapping ---
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
      if (para.trim() === "") {
        lines.push("");
        continue;
      }
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
        // New page
        page = doc.addPage();
        y = 750;
      }
      page.drawText(line, { x, y, size: fontSize, font });
      y -= lineHeight;
    }
    return y;
  }

  // --- GENERATE TEST PDF ---
  let page = testDoc.addPage([612, 792]); // US Letter
  const margin = 50;
  let y = 740;
  const maxW = 512;

  // Title
  page.drawText(testData.title, { x: margin, y, size: 16, font });
  y -= 24;

  // Info line
  page.drawText(`Total: ${testData.total_marks} marks  |  Time: ${testData.time_allowed}`, {
    x: margin, y, size: 10, font
  });
  y -= 20;

  // Topics
  page.drawText(`Topics: ${testData.topics.join(", ")}`, { x: margin, y, size: 9, font });
  y -= 24;

  // Instructions
  page.drawText("Instructions:", { x: margin, y, size: 10, font });
  y -= 14;
  page.drawText("- Answer all questions in the space provided.", { x: margin + 10, y, size: 9, font });
  y -= 12;
  page.drawText("- Show all working for full marks.", { x: margin + 10, y, size: 9, font });
  y -= 12;
  page.drawText("- Approved calculators may be used.", { x: margin + 10, y, size: 9, font });
  y -= 24;

  // Divider
  page.drawLine({ start: { x: margin, y }, end: { x: 562, y }, thickness: 1, color: rgb(0, 0, 0) });
  y -= 20;

  // Questions
  for (const q of testData.questions) {
    if (y < 80) {
      page = testDoc.addPage();
      y = 740;
    }

    // Question header
    page.drawText(`Question ${q.id}`, { x: margin, y, size: 12, font });
    page.drawText(`[${q.marks} marks]`, { x: margin + 120, y, size: 10, font });
    y -= 16;

    // Question text
    y = drawWrappedText(testDoc, page, q.question, margin + 5, y, maxW - 5, 9, font, 13);
    y -= 8;

    // Parts
    for (const part of q.parts) {
      if (y < 60) {
        page = testDoc.addPage();
        y = 740;
      }
      page.drawText(`(${part.label})`, { x: margin + 5, y, size: 9, font });
      y = drawWrappedText(testDoc, page, part.text, margin + 20, y, maxW - 25, 9, font, 13);
      page.drawText(`[${part.marks}]`, { x: margin + maxW - 30, y: y + 3, size: 8, font });
      y -= 10;
    }

    // Working space (blank area)
    y -= 30;
    y = Math.min(y, y); // no change, just visual spacing
  }

  // --- GENERATE SOLUTIONS PDF ---
  let solPage = solDoc.addPage([612, 792]);
  y = 740;

  solPage.drawFontAndSize(solFontBold, 16);
  solPage.drawText(`${testData.title} - WORKED SOLUTIONS`, { x: margin, y, size: 16, font: solFontBold });
  y -= 24;

  solPage.drawFontAndSize(solFont, 10);
  solPage.drawText(`Total: ${testData.total_marks} marks`, { x: margin, y, size: 10, font: solFont });
  y -= 24;

  for (const q of testData.questions) {
    if (y < 60) {
      solPage = solDoc.addPage();
      y = 740;
    }

    solPage.drawFontAndSize(solFontBold, 12);
    solPage.drawText(`Question ${q.id} [${q.marks} marks]`, { x: margin, y, size: 12, font: solFontBold });
    y -= 16;

    solPage.drawFontAndSize(solFont, 9);
    y = drawWrappedText(solDoc, solPage, q.solution, margin + 5, y, maxW - 5, 9, solFont, 13);
    y -= 16;
  }

  return {
    testPdf: await testDoc.save(),
    solPdf: await solDoc.save(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topics: string[] = body.topics || [];

    if (topics.length === 0) {
      return NextResponse.json(
        { error: "At least one topic is required" },
        { status: 400 }
      );
    }

    // Check if this is a PDF request
    const format = request.nextUrl.searchParams.get("format");

    // Generate the test content
    const testData = await generateTest(topics);

    if (format === "test-pdf") {
      const pdfs = await generatePDFs(testData);
      return new NextResponse(pdfs.testPdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="maths-test.pdf"`,
        },
      });
    }

    if (format === "solutions-pdf") {
      const pdfs = await generatePDFs(testData);
      return new NextResponse(pdfs.solPdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="maths-test-solutions.pdf"`,
        },
      });
    }

    // Default: return JSON
    return NextResponse.json({ ok: true, test: testData });

  } catch (error: any) {
    console.error("Maths generator error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate test" },
      { status: 500 }
    );
  }
}
