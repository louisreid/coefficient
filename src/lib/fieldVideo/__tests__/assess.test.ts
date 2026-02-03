/** @jest-environment node */
import { runFieldAssess } from "../assess";
import { HVAC_MINISPLIT_INDOOR_PREP_CONFIG } from "../config";

const mockGenerateContent = jest.fn();
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe("runFieldAssess", () => {
  const validImageBuffer = Buffer.from("fake-image-data");
  const defaultInput = {
    stepId: "STEP_1",
    unitConfig: HVAC_MINISPLIT_INDOOR_PREP_CONFIG,
    imageBuffer: validImageBuffer,
    mimeType: "image/jpeg",
  };

  beforeEach(() => {
    mockGenerateContent.mockReset();
    delete process.env.GEMINI_API_KEY;
  });

  it("returns error when GEMINI_API_KEY is not set", async () => {
    const result = await runFieldAssess(defaultInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("GEMINI_API_KEY");
    }
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns success with parsed data when Gemini returns valid JSON", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const validResponse = {
      stepId: "STEP_1",
      overall: { status: "OK", confidence: 0.9 },
      checks: [
        {
          checkId: "PLATE_LEVEL",
          status: "OK",
          confidence: 0.9,
          evidence: "Plate appears level.",
        },
      ],
      summary: "Good.",
      askNext: [],
      redFlags: [],
    };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(validResponse) },
    });

    const result = await runFieldAssess(defaultInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stepId).toBe("STEP_1");
      expect(result.data.overall.status).toBe("OK");
      expect(result.data.checks).toHaveLength(1);
    }
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("returns error when Gemini response does not match schema", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify({ invalid: "shape" }) },
    });

    const result = await runFieldAssess(defaultInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("schema");
    }
  });

  it("strips markdown code fence from response before parsing", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const validResponse = {
      stepId: "STEP_1",
      overall: { status: "WARN", confidence: 0.7 },
      checks: [],
      summary: "Check drain.",
      askNext: ["Is drain visible?"],
      redFlags: ["DRAIN_SLOPE"],
    };
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "```json\n" + JSON.stringify(validResponse) + "\n```" },
    });

    const result = await runFieldAssess(defaultInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.overall.status).toBe("WARN");
      expect(result.data.redFlags).toContain("DRAIN_SLOPE");
    }
  });
});
