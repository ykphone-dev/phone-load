import { handle, readJson } from "@/features/used-phones/server/api";
import {
  getSellerProduct,
  setSellerProductStatus,
  updateProduct,
} from "@/features/used-phones/server/products";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  return handle(() => getSellerProduct(params.id));
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  return handle(async () => updateProduct(params.id, await readJson(request)));
}

/** PATCH { action: "STOP" | "RESUME" } */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const { action } = await readJson<{ action: "STOP" | "RESUME" }>(request);
    return setSellerProductStatus(params.id, action);
  });
}

export async function DELETE(_: Request, { params }: Ctx) {
  return handle(() => setSellerProductStatus(params.id, "DELETE"));
}
