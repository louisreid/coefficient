import {
  computeScoringSummary,
  type AttemptWithMetadata,
} from "@/lib/competence/scoring";
import { ROV_PRE_DIVE_GO_NO_GO } from "@/lib/competence/config";

describe("computeScoringSummary", () => {
  it("returns FAIL when accuracy < 60%", () => {
    const attempts: AttemptWithMetadata[] = [
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: false },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: false },
    ];
    const summary = computeScoringSummary(attempts, ROV_PRE_DIVE_GO_NO_GO);
    expect(summary.status).toBe("FAIL");
    expect(summary.accuracyPct).toBe(33);
  });

  it("returns FAIL when any criticalFail in metadata", () => {
    const attempts: AttemptWithMetadata[] = [
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      {
        skillTag: ROV_PRE_DIVE_GO_NO_GO,
        isCorrect: false,
        metadata: { criticalFail: true },
      },
    ];
    const summary = computeScoringSummary(attempts, ROV_PRE_DIVE_GO_NO_GO);
    expect(summary.status).toBe("FAIL");
    expect(summary.criticalFailsCount).toBe(1);
  });

  it("returns BORDERLINE when 60% <= accuracy < 75% and no critical fails", () => {
    const attempts: AttemptWithMetadata[] = [
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: false },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: false },
    ];
    const summary = computeScoringSummary(attempts, ROV_PRE_DIVE_GO_NO_GO);
    expect(summary.status).toBe("BORDERLINE");
    expect(summary.accuracyPct).toBe(60);
  });

  it("returns PASS when accuracy >= 75% and no critical fails", () => {
    const attempts: AttemptWithMetadata[] = [
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: true },
      { skillTag: ROV_PRE_DIVE_GO_NO_GO, isCorrect: false },
    ];
    const summary = computeScoringSummary(attempts, ROV_PRE_DIVE_GO_NO_GO);
    expect(summary.status).toBe("PASS");
    expect(summary.accuracyPct).toBe(80);
  });
});
