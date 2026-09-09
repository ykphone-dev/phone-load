import "server-only";
import db from "@/lib/supabase/db";
import { sellers, type SelectSeller } from "@/lib/supabase/schema";
import createServerClient from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { forbidden, unauthorized } from "./errors";

export type SessionContext = {
  user: User | null;
  isAdmin: boolean;
  seller: SelectSeller | null;
};

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = cookies();
  const supabase = createServerClient({ cookieStore });
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function isAdminUser(user: User | null | undefined) {
  return Boolean(user?.app_metadata?.isAdmin);
}

export async function getSellerByUserId(userId: string) {
  return (
    (await db.query.sellers.findFirst({ where: eq(sellers.userId, userId) })) ??
    null
  );
}

/** 현재 요청의 사용자 + 관리자 여부 + 판매자 정보 */
export async function getSessionContext(): Promise<SessionContext> {
  const user = await getSessionUser();
  if (!user) return { user: null, isAdmin: false, seller: null };
  const seller = await getSellerByUserId(user.id);
  return { user, isAdmin: isAdminUser(user), seller };
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminUser(user)) throw forbidden("관리자만 접근할 수 있습니다.");
  return user;
}

/** 승인된 판매자만 통과 */
export async function requireApprovedSeller(): Promise<{
  user: User;
  seller: SelectSeller;
}> {
  const user = await requireUser();
  const seller = await getSellerByUserId(user.id);
  if (!seller) throw forbidden("판매자 입점 신청이 필요합니다.");
  if (seller.status !== "APPROVED") {
    throw forbidden(
      seller.status === "PENDING"
        ? "판매자 승인 대기 중입니다. 승인 후 이용할 수 있습니다."
        : seller.status === "SUSPENDED"
          ? "판매자 계정이 정지되었습니다. 고객센터에 문의하세요."
          : "판매자 입점이 반려되었습니다. 다시 신청해주세요.",
    );
  }
  return { user, seller };
}

export function getRequestIp(): string | null {
  try {
    const h = headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}
