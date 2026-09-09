import {
  handle,
  searchParamsToObject,
} from "@/features/used-phones/server/api";
import { adminListProducts } from "@/features/used-phones/server/products";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { status } = searchParamsToObject(request.url);
  return handle(() => adminListProducts(status as any));
}
