import { handle, readJson } from "@/features/used-phones/server/api";
import { setOrderAccessCookie } from "@/features/used-phones/server/guest-access";
import { lookupGuestOrder } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** 비회원 주문조회: { orderNumber, buyerPhone, password } */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const { orderNumber, token } = await lookupGuestOrder(
      await readJson(request),
    );
    setOrderAccessCookie(orderNumber, token);
    return { orderNumber };
  });
}
