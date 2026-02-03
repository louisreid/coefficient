import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FieldVideoUnitConfig } from "./config";
import {
  fieldAssessResponseSchema,
  type FieldAssessResponse,
} from "./schemas";

const SAFETY_DISCLAIMER =
  "This is for training feedback only. It is not a safety authority or substitute for local codes or supervisor sign-off. When in doubt, consult supervisor and follow local codes.";

export type AssessInput = {
  stepId: string;
  unitConfig: FieldVideoUnitConfig;
  imageBuffer: Buffer;
  mimeType: string;
};

/**
 * Run Gemini multimodal (image + checklist) and return validated JSON.
 */
export async function runFieldAssess(input: AssessInput): Promise<{
  success: true;
  data: FieldAssessResponse;
} | { success: false; error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY not set" };
  }

  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: modelName });

  const checklistJson = JSON.stringify(
    input.unitConfig.checks.map((c) => ({
      checkId: c.checkId,
      label: c.label,
      severity: c.severity,
    }))
  );

  const systemPrompt = [
    SAFETY_DISCLAIMER,
    "You are an assessor reviewing a trainee's field photo against a checklist.",
    "If something is not visible or unclear, say UNKNOWN for that check. Be conservative.",
    "Return ONLY valid JSON, no markdown or extra text.",
    `Checklist for this unit: ${checklistJson}`,
  ].join("\n");

  const userPrompt = [
    `Step: ${input.stepId}. Assess this photo against the checklist above.`,
    "Return JSON with: stepId (string), overall (object with status: OK|WARN|CRIT|UNKNOWN, confidence: 0-1), checks (array of { checkId, status, confidence, evidence, issue?, fix? }), summary (string), askNext (array of short follow-up questions), redFlags (array of strings for critical/high issues).",
  ].join(" ");

  const imagePart = {
    inlineData: {
      data: input.imageBuffer.toString("base64"),
      mimeType: input.mimeType,
    },
  };

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt + "\n\n" + userPrompt },
            imagePart,
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text?.() ?? "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = fieldAssessResponseSchema.safeParse(
      cleaned ? JSON.parse(cleaned) : null
    );

    if (!parsed.success) {
      return {
        success: false,
        error: "Gemini response did not match schema: " + parsed.error.message,
      };
    }

    return { success: true, data: parsed.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed";
    return { success: false, error: message };
  }
}
