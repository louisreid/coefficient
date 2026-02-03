import {
  HVAC_MINISPLIT_INDOOR_PREP,
  FIELD_VIDEO_UNITS,
  HVAC_MINISPLIT_INDOOR_PREP_CONFIG,
  getFieldVideoUnitConfig,
  getFieldVideoUnitsForCohort,
} from "../config";

describe("fieldVideo config", () => {
  it("exports HVAC unit id and includes it in FIELD_VIDEO_UNITS", () => {
    expect(HVAC_MINISPLIT_INDOOR_PREP).toBe("HVAC_MINISPLIT_INDOOR_PREP");
    expect(FIELD_VIDEO_UNITS).toContain(HVAC_MINISPLIT_INDOOR_PREP);
    expect(FIELD_VIDEO_UNITS).toHaveLength(1);
  });

  it("HVAC config has 4 steps and 9 checks", () => {
    expect(HVAC_MINISPLIT_INDOOR_PREP_CONFIG.unitId).toBe(HVAC_MINISPLIT_INDOOR_PREP);
    expect(HVAC_MINISPLIT_INDOOR_PREP_CONFIG.description).toContain("Mini-split");
    expect(HVAC_MINISPLIT_INDOOR_PREP_CONFIG.steps).toHaveLength(4);
    expect(HVAC_MINISPLIT_INDOOR_PREP_CONFIG.checks).toHaveLength(9);
  });

  it("steps have stepId and label", () => {
    const steps = HVAC_MINISPLIT_INDOOR_PREP_CONFIG.steps;
    expect(steps[0]).toEqual({ stepId: "STEP_1", label: "Mounting plate & position" });
    expect(steps[3].stepId).toBe("STEP_4");
  });

  it("checks have checkId, label, severity", () => {
    const checks = HVAC_MINISPLIT_INDOOR_PREP_CONFIG.checks;
    expect(checks.some((c) => c.checkId === "PLATE_LEVEL" && c.severity === "HIGH")).toBe(true);
    expect(checks.some((c) => c.checkId === "DRAIN_SLOPE")).toBe(true);
    expect(checks.some((c) => c.severity === "LOW")).toBe(true);
  });

  it("getFieldVideoUnitConfig returns config for known unitId", () => {
    const config = getFieldVideoUnitConfig(HVAC_MINISPLIT_INDOOR_PREP);
    expect(config).not.toBeNull();
    expect(config!.unitId).toBe(HVAC_MINISPLIT_INDOOR_PREP);
    expect(config!.steps.length).toBe(4);
  });

  it("getFieldVideoUnitConfig returns null for unknown unitId", () => {
    expect(getFieldVideoUnitConfig("UNKNOWN_UNIT")).toBeNull();
    expect(getFieldVideoUnitConfig("")).toBeNull();
  });

  it("getFieldVideoUnitsForCohort returns array of all unit configs", () => {
    const units = getFieldVideoUnitsForCohort();
    expect(units).toHaveLength(1);
    expect(units[0]!.unitId).toBe(HVAC_MINISPLIT_INDOOR_PREP);
  });
});
