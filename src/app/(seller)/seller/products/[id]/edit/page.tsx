import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ProductStatusBadge,
  SectionTitle,
} from "@/features/used-phones/components";
import { ProductForm } from "@/features/used-phones/components/seller/ProductForm";
import {
  INSPECTION_ITEMS,
  type ImageKind,
  type InspectionResult,
} from "@/features/used-phones/constants";
import { AppError } from "@/features/used-phones/server/errors";
import {
  getSellerProduct,
  type SellerProductDetail,
} from "@/features/used-phones/server/products";
import { guardSellerPage } from "@/features/used-phones/server/seller-guard";
import type { ProductFormInput } from "@/features/used-phones/validations";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function toFormDefaults(p: SellerProductDetail): ProductFormInput {
  const inspection = Object.fromEntries(
    INSPECTION_ITEMS.map((k) => [
      k,
      (p.inspection?.[k] as InspectionResult | undefined) ?? "UNKNOWN",
    ]),
  ) as ProductFormInput["inspection"];
  return {
    brand: p.brand,
    model: p.model,
    storage: p.storage,
    color: p.color,
    price: p.price,
    conditionGrade: p.conditionGrade,
    screenCondition: p.screenCondition,
    frameCondition: p.frameCondition,
    backCondition: p.backCondition,
    batteryHealth: p.batteryHealth ?? null,
    batteryStatus: p.batteryStatus ?? null,
    repairHistory: p.repairHistory,
    repairNote: p.repairNote ?? "",
    partsReplacement: p.partsReplacement,
    partsNote: p.partsNote ?? "",
    notLostOrStolen: p.notLostOrStolen,
    normalTermination: p.normalTermination,
    contractDiscount: p.contractDiscount,
    imei: p.imei ?? "",
    description: p.description ?? "",
    inspection,
    images: p.images.map((img) => ({
      imageUrl: img.imageUrl,
      kind: img.kind as ImageKind,
    })),
    publish: p.status === "ON_SALE",
  };
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  await guardSellerPage();

  let product: SellerProductDetail;
  try {
    product = await getSellerProduct(params.id);
  } catch (err) {
    if (err instanceof AppError && err.status === 404) notFound();
    throw err;
  }

  const locked = product.status === "RESERVED" || product.status === "SOLD";

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <SectionTitle
          right={
            <Link
              href="/seller/products"
              className="text-sm text-zinc-500 underline-offset-4 hover:underline"
            >
              목록으로
            </Link>
          }
        >
          상품 수정
        </SectionTitle>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span>
            {product.model} {product.storage}
          </span>
          <ProductStatusBadge status={product.status} />
        </div>
      </div>

      {locked ? (
        <Alert>
          <AlertTitle>수정할 수 없는 상품입니다</AlertTitle>
          <AlertDescription>
            {product.status === "RESERVED"
              ? "주문이 진행 중인 상품은 수정할 수 없습니다. 주문이 취소되면 다시 수정할 수 있습니다."
              : "판매완료된 상품은 수정할 수 없습니다."}
            <div className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href="/seller/orders">주문관리로 이동</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <ProductForm
          mode="edit"
          productId={product.id}
          defaultValues={toFormDefaults(product)}
        />
      )}
    </div>
  );
}
