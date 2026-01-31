import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

type ExplainRequest = {
  question?: string;
  correctAnswer?: string;
  studentAnswer?: string;
  skillTag?: string;
  scenarioPrompt?: string;
  traineeChoice?: string;
  correctChoice?: string;
  tags?: string[];
  criticalFail?: boolean;
  justification?: string;
};

type AssessorFeedbackResponse = {
  likelyFailureMode?: string;
  whyItMatters?: string;
  correctAction?: string;
  correctSequence?: string[];
  remediationDrill?: string[];
};

type LegacyResponse = {
  likelyMistake?: string;
  explanation?: string;
  steps?: string[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ExplainRequest;
  const question = body.question?.trim();
  const correctAnswer = body.correctAnswer?.trim();
  const studentAnswer = body.studentAnswer?.trim();

  if (!question || !correctAnswer || !studentAnswer) {
    return new Response("Missing payload.", { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("Missing GEMINI_API_KEY.", { status: 500 });
  }

  const modelName = "gemini-1.5-flash";
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName });

  const isScenario =
    body.scenarioPrompt != null ||
    body.traineeChoice != null ||
    body.correctChoice != null;

  const prompt = isScenario
    ? [
        "You are an assessor giving feedback on a competence assessment. Return JSON only.",
        'Return JSON with keys: "likelyFailureMode", "whyItMatters", "correctAction", "correctSequence" (array of 3-5 short bullet steps), "remediationDrill" (array of exactly 2 short follow-up micro-questions).',
        "Keep it short and safety/operations focused.",
        "Scenario: " + (body.scenarioPrompt ?? question),
        "Trainee selected: " + (body.traineeChoice ?? studentAnswer),
        "Correct answer: " + (body.correctChoice ?? correctAnswer),
        body.tags?.length ? "Failure mode tags: " + body.tags.join(", ") : null,
        body.criticalFail ? "This was a critical fail (unsafe action)." : null,
        body.justification ? "Trainee justification: " + body.justification : null,
        body.skillTag ? "Unit: " + body.skillTag : null,
      ]
        .filter(Boolean)
        .join("\n")
    : [
        "You are a math tutor. Return JSON only.",
        'Return JSON with keys: {"likelyMistake": "...", "explanation": "...", "steps": ["...","..."]}.',
        "Keep it short, student-friendly, and reference the numbers.",
        "Question: " + question,
        "Student answer: " + studentAnswer,
        "Correct answer: " + correctAnswer,
        body.skillTag ? `Skill tag: ${body.skillTag}` : null,
      ]
        .filter(Boolean)
        .join("\n");

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: isScenario ? 400 : 80,
      },
    });

    const text = result.response.text();
    if (isScenario) {
      let parsed: AssessorFeedbackResponse | null = null;
      try {
        parsed = JSON.parse(text) as AssessorFeedbackResponse;
      } catch {
        parsed = {
          likelyFailureMode: "Procedure or judgment error",
          whyItMatters: "Safety and auditability depend on correct procedure.",
          correctAction: "Follow the pre-dive/go-no-go checklist and escalate when in doubt.",
          correctSequence: [
            "Complete all checklist items before sign-off.",
            "Do not launch with known defects or unresolved anomalies.",
            "Escalate to supervisor when outside standard procedure.",
          ],
          remediationDrill: [
            "When may you skip a checklist item?",
            "Who has authority to give the final go for launch?",
          ],
        };
      }
      return Response.json(parsed);
    }

    let parsed: LegacyResponse | null = null;
    try {
      parsed = JSON.parse(text) as LegacyResponse;
    } catch {
      parsed = {
        likelyMistake: "Check the operation order.",
        explanation: "Do multiplication/division before addition/subtraction.",
        steps: [],
      };
    }
    return Response.json(parsed);
  } catch {
    return Response.json(
      { error: "Gemini request failed." },
      { status: 500 },
    );
  }
}
