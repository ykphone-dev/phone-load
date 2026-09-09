import { handle } from "@/features/used-phones/server/api";
import { notFound } from "@/features/used-phones/server/errors";
import { getPublicProduct } from "@/features/used-phones/server/products";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const p = await getPublicProduct(params.id);
    if (!p) throw notFound("상품을 찾을 수 없습니다.");
    return p;
  });
}
