import { handle, readJson } from "@/features/used-phones/server/api";
import { setOrderAccessCookie } from "@/features/used-phones/server/guest-access";
import { createOrder, listMyOrders } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** 회원 본인 주문 목록 */
export async function GET() {
  return handle(() => listMyOrders());
}

/** 주문 생성. 응답과 함께 주문 접근 쿠키를 내려준다. */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const { order, token, reservationMinutes } = await createOrder(await readJson(request));
    setOrderAccessCookie(order.orderNumber, token);
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      reservedUntil: order.reservedUntil,
      reservationMinutes,
    };
  }, 201);
}
