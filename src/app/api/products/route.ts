import { handle, searchParamsToObject } from "@/features/used-phones/server/api";
import { listPublicProducts } from "@/features/used-phones/server/products";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/products?brand=&model=&storage=&grade=&minPrice=&maxPrice=&sort=&page= */
export async function GET(request: NextRequest) {
  return handle(() => listPublicProducts(searchParamsToObject(request.url) as any));
}
