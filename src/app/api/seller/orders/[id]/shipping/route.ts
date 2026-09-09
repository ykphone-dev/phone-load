import { handle, readJson } from "@/features/used-phones/server/api";
import {
  sellerMarkDelivered,
  sellerShip,
} from "@/features/used-phones/server/orders";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

/** 송장 등록 { carrier, trackingNumber, shippedAt? } */
export async function POST(request: NextRequest, { params }: Ctx) {
  return handle(async () => sellerShip(params.id, await readJson(request)));
}

/** 배송완료 처리 */
export async function PATCH(_: Request, { params }: Ctx) {
  return handle(() => sellerMarkDelivered(params.id));
}
