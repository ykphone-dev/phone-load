import "server-only";
import type { SelectSeller } from "@/lib/supabase/schema";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getSessionContext } from "./auth";

/**
 * 판매자센터 페이지 공용 가드 (Server Component 전용).
 *  - 미로그인 → 로그인 페이지
 *  - 판매자 미등록 → 입점 신청
 *  - 승인 전/반려/정지 → 상태 안내 페이지
 */
export async function guardSellerPage(): Promise<{ user: User; seller: SelectSeller }> {
  const ctx = await getSessionContext();
  if (!ctx.user) redirect("/sign-in?from=/seller");
  if (!ctx.seller) redirect("/seller/register");
  if (ctx.seller.status !== "APPROVED") redirect("/seller/pending");
  return { user: ctx.user, seller: ctx.seller };
}
