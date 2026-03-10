import { prisma } from "@/lib/prisma";

export async function recordAudit(params: {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      description: params.description,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
