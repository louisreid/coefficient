/**
 * EPIC 4.2 — Audit log: every action logged, immutable, reconstruct AI vs human.
 */

import { prisma } from "@/lib/db";

export type AuditActorType = "ai" | "assessor" | "system";

export type AuditPayload = Record<string, unknown>;

/**
 * Append an immutable audit event. Do not update or delete.
 */
export async function appendAuditEvent(params: {
  actorType: AuditActorType;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: AuditPayload | null;
}): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorType: params.actorType,
      actorId: params.actorId ?? undefined,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      payload: params.payload == null ? undefined : (params.payload as object),
    },
  });
}

/** Log assessor override (human decision). */
export async function logAssessorOverride(params: {
  assessorId: string;
  studentId: string;
  unitId: string;
  overrideStatus: string;
  assessorNote: string | null;
}): Promise<void> {
  await appendAuditEvent({
    actorType: "assessor",
    actorId: params.assessorId,
    action: "override",
    entityType: "AssessmentOverride",
    entityId: `${params.studentId}:${params.unitId}`,
    payload: {
      overrideStatus: params.overrideStatus,
      assessorNote: params.assessorNote,
    },
  });
}

/** Log evidence pack export. */
export async function logEvidenceExport(params: {
  assessorId: string;
  studentId: string;
  unitId: string;
  classId: string;
  format: "html" | "json" | "pdf";
}): Promise<void> {
  await appendAuditEvent({
    actorType: "assessor",
    actorId: params.assessorId,
    action: "evidence_export",
    entityType: "EvidencePack",
    entityId: params.studentId,
    payload: {
      unitId: params.unitId,
      classId: params.classId,
      format: params.format,
      exportedAt: new Date().toISOString(),
    },
  });
}
