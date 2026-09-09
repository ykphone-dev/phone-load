import { handle, readJson, searchParamsToObject } from "@/features/used-phones/server/api";
import { createProduct, listSellerProducts } from "@/features/used-phones/server/products";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { status } = searchParamsToObject(request.url);
  return handle(() => listSellerProducts(status as any));
}

export async function POST(request: NextRequest) {
  return handle(async () => createProduct(await readJson(request)), 201);
}
