/**
 * Field Video Assessment — unit configs (steps + checklist).
 * Reusable shape for HVAC and other trades.
 */

export const HVAC_MINISPLIT_INDOOR_PREP = "HVAC_MINISPLIT_INDOOR_PREP" as const;

export type FieldVideoUnitId = typeof HVAC_MINISPLIT_INDOOR_PREP;

export const FIELD_VIDEO_UNITS: FieldVideoUnitId[] = [HVAC_MINISPLIT_INDOOR_PREP];

export type CheckSeverity = "HIGH" | "MED" | "LOW";

export type FieldVideoCheck = {
  checkId: string;
  label: string;
  severity: CheckSeverity;
};

export type FieldVideoStep = {
  stepId: string;
  label: string;
};

export type FieldVideoUnitConfig = {
  unitId: FieldVideoUnitId;
  description: string;
  steps: FieldVideoStep[];
  checks: FieldVideoCheck[];
};

const HVAC_STEPS: FieldVideoStep[] = [
  { stepId: "STEP_1", label: "Mounting plate & position" },
  { stepId: "STEP_2", label: "Clearances & alignment" },
  { stepId: "STEP_3", label: "Line-set routing & bend radius" },
  { stepId: "STEP_4", label: "Drain routing slope (if visible)" },
];

const HVAC_CHECKS: FieldVideoCheck[] = [
  { checkId: "PLATE_LEVEL", label: "Mounting plate level", severity: "HIGH" },
  { checkId: "FASTENING_ANCHORING", label: "Fastening / anchoring secure", severity: "HIGH" },
  { checkId: "CLEARANCES", label: "Clearances per spec", severity: "MED" },
  { checkId: "HOLE_SLOPE_OUTWARD", label: "Penetration hole slope outward", severity: "MED" },
  { checkId: "LINESET_KINKS", label: "Line-set free of kinks", severity: "HIGH" },
  { checkId: "BEND_RADIUS", label: "Bend radius within spec", severity: "MED" },
  { checkId: "INSULATION_PRESENT", label: "Insulation present on line-set", severity: "MED" },
  { checkId: "DRAIN_SLOPE", label: "Drain line slope correct", severity: "HIGH" },
  { checkId: "WORK_AREA_SAFETY", label: "Work area safety", severity: "LOW" },
];

export const HVAC_MINISPLIT_INDOOR_PREP_CONFIG: FieldVideoUnitConfig = {
  unitId: HVAC_MINISPLIT_INDOOR_PREP,
  description:
    "Mini-split indoor unit mounting + line-set routing prep (before brazing)",
  steps: HVAC_STEPS,
  checks: HVAC_CHECKS,
};

const UNIT_CONFIGS: Record<FieldVideoUnitId, FieldVideoUnitConfig> = {
  [HVAC_MINISPLIT_INDOOR_PREP]: HVAC_MINISPLIT_INDOOR_PREP_CONFIG,
};

export function getFieldVideoUnitConfig(
  unitId: string
): FieldVideoUnitConfig | null {
  if (unitId in UNIT_CONFIGS) {
    return UNIT_CONFIGS[unitId as FieldVideoUnitId];
  }
  return null;
}

export function getFieldVideoUnitsForCohort(): FieldVideoUnitConfig[] {
  return FIELD_VIDEO_UNITS.map((id) => UNIT_CONFIGS[id]);
}
