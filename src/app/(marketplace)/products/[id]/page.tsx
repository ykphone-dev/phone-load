import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ConditionSummary, GradeBadge, ProductGallery, ProductStatusBadge } from "@/features/used-phones/components";
import { BATTERY_STATUS_LABEL, BRAND_LABEL, PLATFORM_NOTICE_NOT_PARTY, type BatteryStatus, type Brand } from "@/features/used-phones/constants";
import { getPublicProduct } from "@/features/used-phones/server/products";
import { formatDateOnly, formatKRW } from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getPublicProduct(params.id);
  if (!product) notFound();

  const onSale = product.status === "ON_SALE" && product.seller.status === "APPROVED";
  const battery =
    product.brand === "APPLE"
      ? product.batteryHealth != null ? `${product.batteryHealth}%` : null
      : product.batteryStatus ? BATTERY_STATUS_LABEL[product.batteryStatus as BatteryStatus] : null;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductGallery images={product.images} alt={`${product.model} ${product.storage}`} />

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">{BRAND_LABEL[product.brand as Brand] ?? product.brand}</p>
          <h1 className="text-2xl font-semibold leading-tight">
            {product.model} {product.storage}
          </h1>
          <p className="text-zinc-600">{product.color}</p>
          <div className="flex items-center gap-2 pt-1">
            <GradeBadge grade={product.conditionGrade} />
            {!onSale && <ProductStatusBadge status={product.status} />}
          </div>
        </div>

        <p className="text-3xl font-bold">{formatKRW(product.price)}</p>

        <dl className="grid grid-cols-2 gap-y-2 border-y py-3 text-sm">
          <dt className="text-zinc-500">판매자</dt>
          <dd>{product.seller.businessName}</dd>
          <dt className="text-zinc-500">등급</dt>
          <dd>{product.conditionGrade}등급</dd>
          {battery && (
            <>
              <dt className="text-zinc-500">배터리</dt>
              <dd>{battery}</dd>
            </>
          )}
          {product.imeiMasked && (
            <>
              <dt className="text-zinc-500">IMEI</dt>
              <dd className="font-mono">{product.imeiMasked}</dd>
            </>
          )}
          <dt className="text-zinc-500">등록일</dt>
          <dd>{formatDateOnly(product.createdAt)}</dd>
        </dl>

        {onSale ? (
          <Link href={`/products/${product.id}/order`} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            구매하기
          </Link>
        ) : (
          <button type="button" disabled className={cn(buttonVariants({ size: "lg" }), "w-full opacity-50")}>
            {product.status === "RESERVED" ? "다른 고객이 주문 진행중입니다" : "판매가 종료된 상품입니다"}
          </button>
        )}

        <div className="space-y-1 rounded-sm bg-zinc-50 p-3 text-xs text-zinc-600">
          <p>{PLATFORM_NOTICE_NOT_PARTY}</p>
          <p>주문 후 판매자 사업자계좌로 직접 입금하며, 판매자가 입금을 확인한 뒤 배송됩니다.</p>
        </div>

        {product.description && (
          <section>
            <h3 className="mb-2 font-semibold">판매자 설명</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{product.description}</p>
          </section>
        )}
      </div>

      <div className="md:col-span-2">
        <h2 className="mb-4 text-lg font-semibold">상태 정보</h2>
        <ConditionSummary product={product} />
      </div>
    </div>
  );
}
