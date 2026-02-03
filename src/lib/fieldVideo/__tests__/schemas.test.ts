import {
  fieldAssessResponseSchema,
  fieldAssessCheckSchema,
  fieldAssessOverallSchema,
  generateNoteResponseSchema,
} from "../schemas";

describe("fieldVideo schemas", () => {
  describe("fieldAssessOverallSchema", () => {
    it("accepts valid overall", () => {
      const result = fieldAssessOverallSchema.safeParse({
        status: "OK",
        confidence: 0.9,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = fieldAssessOverallSchema.safeParse({
        status: "PASS",
        confidence: 0.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects confidence out of range", () => {
      expect(fieldAssessOverallSchema.safeParse({ status: "OK", confidence: 1.5 }).success).toBe(false);
      expect(fieldAssessOverallSchema.safeParse({ status: "OK", confidence: -0.1 }).success).toBe(false);
    });
  });

  describe("fieldAssessCheckSchema", () => {
    it("accepts valid check with optional fields", () => {
      const result = fieldAssessCheckSchema.safeParse({
        checkId: "PLATE_LEVEL",
        status: "WARN",
        confidence: 0.7,
        evidence: "Plate appears slightly off level.",
        issue: "Verify with level.",
      });
      expect(result.success).toBe(true);
    });

    it("accepts check without issue and fix", () => {
      const result = fieldAssessCheckSchema.safeParse({
        checkId: "DRAIN_SLOPE",
        status: "OK",
        confidence: 0.95,
        evidence: "Drain line slopes correctly.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = fieldAssessCheckSchema.safeParse({
        checkId: "X",
        status: "FAIL",
        confidence: 0.5,
        evidence: "x",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("fieldAssessResponseSchema", () => {
    it("accepts valid full response", () => {
      const payload = {
        stepId: "STEP_1",
        overall: { status: "WARN", confidence: 0.8 },
        checks: [
          {
            checkId: "PLATE_LEVEL",
            status: "OK",
            confidence: 0.9,
            evidence: "Level.",
          },
        ],
        summary: "Mostly good; one item to verify.",
        askNext: ["Is the drain visible?"],
        redFlags: [],
      };
      const result = fieldAssessResponseSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects missing stepId", () => {
      const payload = {
        overall: { status: "OK", confidence: 1 },
        checks: [],
        summary: "Ok",
        askNext: [],
        redFlags: [],
      };
      expect(fieldAssessResponseSchema.safeParse(payload).success).toBe(false);
    });

    it("rejects invalid check in array", () => {
      const payload = {
        stepId: "STEP_1",
        overall: { status: "OK", confidence: 1 },
        checks: [{ checkId: "X", status: "INVALID", confidence: 0.5, evidence: "x" }],
        summary: "x",
        askNext: [],
        redFlags: [],
      };
      expect(fieldAssessResponseSchema.safeParse(payload).success).toBe(false);
    });
  });

  describe("generateNoteResponseSchema", () => {
    it("accepts valid generate-note response", () => {
      const payload = {
        recommendation: "Review drain slope with trainee.",
        note: "Drain slope was flagged; recommend on-site check.",
        citations: ["DRAIN_SLOPE"],
        confidence: 0.85,
      };
      const result = generateNoteResponseSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects confidence > 1", () => {
      const payload = {
        recommendation: "x",
        note: "x",
        citations: [],
        confidence: 1.1,
      };
      expect(generateNoteResponseSchema.safeParse(payload).success).toBe(false);
    });
  });
});
