import { handle, searchParamsToObject } from "@/features/used-phones/server/api";
import { adminListOrders } from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { status } = searchParamsToObject(request.url);
  return handle(() => adminListOrders(status as any));
}
