import Image from "next/image";
import Link from "next/link";
import {
  BATTERY_STATUS_LABEL,
  BRAND_LABEL,
  type BatteryStatus,
  type Brand,
} from "../constants";
import { formatKRW } from "../utils";
import { GradeBadge, ProductStatusBadge } from "./StatusBadge";

export type ProductCardData = {
  id: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  price: number;
  conditionGrade: string;
  batteryHealth: number | null;
  batteryStatus: string | null;
  status: string;
  images: { imageUrl: string }[];
  seller?: { businessName: string } | null;
};

/**
 * 상품목록 카드. 기획서 26: 정보를 많이 넣지 않는다.
 *   [사진] / 모델 / 용량·색상 / 등급 / 배터리 / 가격 / 판매자
 */
export function ProductCard({
  product,
  href,
}: {
  product: ProductCardData;
  href?: string;
}) {
  const image = product.images[0]?.imageUrl;
  const battery =
    product.brand === "APPLE" && product.batteryHealth != null
      ? `배터리 ${product.batteryHealth}%`
      : product.batteryStatus
        ? `배터리 ${BATTERY_STATUS_LABEL[product.batteryStatus as BatteryStatus] ?? product.batteryStatus}`
        : null;
  const unavailable = product.status !== "ON_SALE";

  return (
    <Link href={href ?? `/products/${product.id}`} className="group block">
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {image ? (
          <Image
            src={image}
            alt={`${product.model} ${product.storage}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
            사진 없음
          </div>
        )}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <ProductStatusBadge status={product.status} />
          </div>
        )}
        <GradeBadge
          grade={product.conditionGrade}
          className="absolute left-2 top-2"
        />
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-xs text-zinc-500">
          {BRAND_LABEL[product.brand as Brand] ?? product.brand}
        </p>
        <p className="font-medium leading-tight">{product.model}</p>
        <p className="text-sm text-zinc-600">
          {product.storage} / {product.color}
        </p>
        {battery && <p className="text-xs text-zinc-500">{battery}</p>}
        <p className="pt-1 text-lg font-semibold">{formatKRW(product.price)}</p>
        {product.seller && (
          <p className="text-xs text-zinc-500">{product.seller.businessName}</p>
        )}
      </div>
    </Link>
  );
}
