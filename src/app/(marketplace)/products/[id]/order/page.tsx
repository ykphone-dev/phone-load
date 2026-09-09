import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GradeBadge } from "@/features/used-phones/components";
import { OrderForm } from "@/features/used-phones/components/market/OrderForm";
import { getSessionContext } from "@/features/used-phones/server/auth";
import { getPublicProduct } from "@/features/used-phones/server/products";
import { formatKRW } from "@/features/used-phones/utils";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, ctx] = await Promise.all([
    getPublicProduct(params.id),
    getSessionContext(),
  ]);
  if (!product) notFound();
  if (product.status !== "ON_SALE") redirect(`/products/${product.id}`);

  const image = product.images[0]?.imageUrl;

  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">주문정보 입력</h1>
        <p className="mb-6 text-sm text-zinc-500">
          주문 완료 후 판매자 계좌가 표시됩니다. 입금 확인 후 배송이 시작됩니다.
        </p>
        <OrderForm
          productId={product.id}
          isLoggedIn={Boolean(ctx.user)}
          defaultName={
            (ctx.user?.user_metadata?.name as string | undefined) ?? ""
          }
        />
      </div>

      <aside className="h-fit space-y-4 border p-4 md:sticky md:top-20">
        <h2 className="font-semibold">주문 상품</h2>
        <div className="flex gap-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-zinc-100">
            {image && (
              <Image
                src={image}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            )}
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium">
              {product.model} {product.storage}
            </p>
            <p className="text-zinc-500">{product.color}</p>
            <GradeBadge grade={product.conditionGrade} />
          </div>
        </div>
        <dl className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">판매자</dt>
            <dd>{product.seller.businessName}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>결제 금액</dt>
            <dd>{formatKRW(product.price)}</dd>
          </div>
        </dl>
        <p className="text-xs text-zinc-500">결제수단: 판매자 계좌 직접 이체</p>
        <Link
          href={`/products/${product.id}`}
          className="block text-center text-xs text-zinc-500 underline"
        >
          상품으로 돌아가기
        </Link>
      </aside>
    </div>
  );
}
