import { expireStaleReservations } from "@/features/used-phones/server/orders";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 입금기한 만료 주문 자동취소.
 * Vercel Cron 또는 외부 스케줄러에서 호출. CRON_SECRET 이 설정되어 있으면 Bearer 검증.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
  }
  const expired = await expireStaleReservations();
  return NextResponse.json({ ok: true, data: { expired } });
}
