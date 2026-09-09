import "server-only";
import db from "@/lib/supabase/db";
import { auditLogs } from "@/lib/supabase/schema";
import { getRequestIp } from "./auth";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type AuditActorRole = "BUYER" | "GUEST" | "SELLER" | "ADMIN" | "SYSTEM";

export type AuditInput = {
  userId?: string | null;
  actorRole: AuditActorRole;
  action: string;
  entityType:
    | "seller"
    | "phone_product"
    | "phone_order"
    | "refund_request"
    | "dispute"
    | "setting";
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | null;
};

/**
 * 감사 로그. 판매자/소비자가 "나는 버튼을 누르지 않았다" 고 할 때의 근거.
 * 트랜잭션 안에서 호출할 수 있도록 tx 를 받는다.
 */
export async function logAudit(input: AuditInput, tx?: Tx) {
  const executor = tx ?? db;
  await executor.insert(auditLogs).values({
    userId: input.userId ?? null,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
    ip: input.ip ?? getRequestIp(),
  });
}
