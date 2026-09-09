import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ConditionSummary,
  CopyButton,
  EmptyState,
  GradeBadge,
  KeyValueList,
  OrderStatusBadge,
  ProductGallery,
  ProductStatusBadge,
  SectionTitle,
} from "@/features/used-phones/components";
import { ForceStopProductButton } from "@/features/used-phones/components/admin";
import {
  BRAND_LABEL,
  PRODUCT_STATUS_LABEL,
} from "@/features/used-phones/constants";
import { AppError } from "@/features/used-phones/server/errors";
import { adminGetProduct } from "@/features/used-phones/server/products";
import {
  formatDateTime,
  formatKRW,
  productTitle,
} from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function AdminPhoneDetailPage({ params }: Props) {
  let data: Awaited<ReturnType<typeof adminGetProduct>>;
  try {
    data = await adminGetProduct(params.id);
  } catch (err) {
    if (err instanceof AppError) {
      if (err.status === 404) notFound();
      if (err.status === 401 || err.status === 403) redirect("/sign-in");
    }
    throw err;
  }
  const { product, orders } = data;
  const title = productTitle(product);

  return (
    <AdminShell
      heading={title}
      description={`상품 상세 · ${PRODUCT_STATUS_LABEL[product.status] ?? product.status}`}
      showBackButton
    >
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3 border p-4">
        <div className="flex items-center gap-3">
          <ProductStatusBadge status={product.status} />
          <GradeBadge grade={product.conditionGrade} />
          <span className="text-sm text-zinc-500">
            등록일 {formatDateTime(product.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {product.status === "ON_SALE" && (
            <ForceStopProductButton productId={product.id} size="default" />
          )}
          {product.status !== "ON_SALE" && (
            <span className="text-xs text-zinc-500">
              판매중 상품만 강제 판매중지할 수 있습니다.
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <ProductGallery images={product.images} alt={title} />
        </section>

        <section className="space-y-8">
          <div>
            <SectionTitle>기본 정보</SectionTitle>
            <KeyValueList
              items={[
                {
                  label: "브랜드",
                  value: BRAND_LABEL[product.brand] ?? product.brand,
                },
                { label: "모델", value: product.model },
                { label: "용량", value: product.storage },
                { label: "색상", value: product.color },
                {
                  label: "판매가",
                  value: (
                    <span className="font-semibold">
                      {formatKRW(product.price)}
                    </span>
                  ),
                },
                {
                  label: "IMEI",
                  value: product.imei ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="font-mono">{product.imei}</span>
                      <CopyButton value={product.imei} />
                    </span>
                  ) : (
                    <span className="text-zinc-400">미입력</span>
                  ),
                },
                {
                  label: "판매자",
                  value: (
                    <Link
                      href={`/admin/sellers/${product.seller.id}`}
                      className="underline"
                    >
                      {product.seller.businessName}
                    </Link>
                  ),
                },
                { label: "판매자 연락처", value: product.seller.contactPhone },
                {
                  label: "최근 수정",
                  value: formatDateTime(product.updatedAt),
                },
              ]}
            />
            <p className="mt-2 text-xs text-zinc-500">
              IMEI 전체 번호는 관리자와 판매자에게만 표시됩니다. 소비자
              화면에서는 마스킹됩니다.
            </p>
          </div>

          <div>
            <SectionTitle>상품 설명</SectionTitle>
            {product.description ? (
              <p className="whitespace-pre-wrap border p-3 text-sm">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-zinc-400">등록된 설명이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <SectionTitle>상태 · 검수 정보</SectionTitle>
        <ConditionSummary product={product} />
      </section>

      <section className="mt-10">
        <SectionTitle
          right={
            <span className="text-sm text-zinc-500">{orders.length}건</span>
          }
        >
          이 상품의 주문
        </SectionTitle>
        {orders.length === 0 ? (
          <EmptyState title="주문 내역이 없습니다." />
        ) : (
          <div className="overflow-x-auto border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문번호</TableHead>
                  <TableHead>구매자</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>주문일시</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/admin/phone-orders/${o.id}`}
                        className="hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {o.buyerName}
                      <span className="ml-1 text-xs text-zinc-500">
                        {o.buyerPhone}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatKRW(o.price)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-500">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/phone-orders/${o.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                      >
                        상세
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
