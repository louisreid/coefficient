import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateNoteResponseSchema,
  type GenerateNoteResponse,
} from "@/lib/fieldVideo/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST body: { captureId }
 * Generate trainer note with citations from CaptureAssessment; return recommendation, note, citations, confidence.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { captureId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const captureId = body.captureId;
  if (!captureId) {
    return new Response(
      JSON.stringify({ error: "Missing captureId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const capture = await prisma.evidenceCapture.findFirst({
    where: { id: captureId },
    include: { captureAssessment: true, student: { select: { nickname: true } } },
  });

  if (!capture) {
    return new Response(
      JSON.stringify({ error: "Capture not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const cls = await prisma.class.findFirst({
    where: { id: capture.classId, teacherId: session.user.id },
    select: { id: true },
  });
  if (!cls) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const assessment = capture.captureAssessment;
  if (!assessment) {
    return new Response(
      JSON.stringify({ error: "No assessment for this capture" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback: GenerateNoteResponse = {
      recommendation: "Review the checklist results and add your own note.",
      note: assessment.aiSummary ?? "No AI summary available.",
      citations: [],
      confidence: 0,
    };
    return Response.json(fallback);
  }

  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName });

  const prompt = [
    "You are generating a short trainer note for an assessor reviewing a trainee's field capture.",
    "Use the following assessment data. Cite specific check results where relevant.",
    "Return ONLY valid JSON with keys: recommendation (string), note (string), citations (array of strings), confidence (0-1 number).",
    "",
    "Assessment summary: " + (assessment.aiSummary ?? "N/A"),
    "Overall status: " + (assessment.aiOverallStatus ?? "N/A"),
    "Checks: " + JSON.stringify(assessment.aiChecks ?? []),
    "Triage flags: " + JSON.stringify(assessment.triageFlags ?? {}),
  ].join("\n");

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text?.() ?? "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = generateNoteResponseSchema.safeParse(
      cleaned ? JSON.parse(cleaned) : null
    );

    if (parsed.success) {
      await prisma.captureAssessment.update({
        where: { id: assessment.id },
        data: { trainerNote: parsed.data.note },
      });
      return Response.json(parsed.data);
    }

    const fallback: GenerateNoteResponse = {
      recommendation: "Review and add your own note.",
      note: assessment.aiSummary ?? "",
      citations: [],
      confidence: 0.5,
    };
    return Response.json(fallback);
  } catch {
    const fallback: GenerateNoteResponse = {
      recommendation: "Review the checklist and add your own note.",
      note: assessment.aiSummary ?? "",
      citations: [],
      confidence: 0,
    };
    return Response.json(fallback);
  }
}
