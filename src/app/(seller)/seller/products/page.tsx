import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmptyState,
  GradeBadge,
  ProductStatusBadge,
  SectionTitle,
} from "@/features/used-phones/components";
import { ProductRowActions } from "@/features/used-phones/components/seller/ProductRowActions";
import { BRAND_LABEL, PRODUCT_STATUSES, type Brand, type ProductStatus } from "@/features/used-phones/constants";
import { listSellerProducts } from "@/features/used-phones/server/products";
import { guardSellerPage } from "@/features/used-phones/server/seller-guard";
import { formatDateTime, formatKRW } from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FILTERS: { label: string; value?: ProductStatus }[] = [
  { label: "전체" },
  { label: "판매중", value: "ON_SALE" },
  { label: "작성중", value: "DRAFT" },
  { label: "주문 진행중", value: "RESERVED" },
  { label: "판매완료", value: "SOLD" },
  { label: "판매중지", value: "STOPPED" },
];

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  await guardSellerPage();
  const raw = searchParams?.status;
  const status = PRODUCT_STATUSES.includes(raw as ProductStatus) && raw !== "DELETED" ? (raw as ProductStatus) : undefined;
  const products = await listSellerProducts(status);

  return (
    <div className="space-y-6">
      <SectionTitle
        right={
          <Button asChild>
            <Link href="/seller/products/new">상품 등록</Link>
          </Button>
        }
      >
        상품관리
      </SectionTitle>

      <nav className="flex flex-wrap gap-1 border-b">
        {FILTERS.map((f) => {
          const active = f.value === status;
          return (
            <Link
              key={f.label}
              href={f.value ? `/seller/products?status=${f.value}` : "/seller/products"}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                active ? "border-black font-medium text-black" : "border-transparent text-zinc-500 hover:text-black",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {products.length === 0 ? (
        <EmptyState title="등록된 상품이 없습니다" description="첫 상품을 등록하고 판매를 시작하세요.">
          <Button asChild size="sm" className="mt-2">
            <Link href="/seller/products/new">상품 등록</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">사진</TableHead>
                <TableHead>모델 / 용량 / 색상</TableHead>
                <TableHead>등급</TableHead>
                <TableHead className="text-right">가격</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const thumb = p.images[0]?.imageUrl;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden border bg-zinc-50">
                        {thumb ? (
                          <Image src={thumb} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">없음</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{p.model}</div>
                      <div className="text-xs text-zinc-500">
                        {BRAND_LABEL[p.brand as Brand]} · {p.storage} · {p.color}
                      </div>
                    </TableCell>
                    <TableCell>
                      <GradeBadge grade={p.conditionGrade} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">{formatKRW(p.price)}</TableCell>
                    <TableCell>
                      <ProductStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-zinc-500">{formatDateTime(p.createdAt)}</TableCell>
                    <TableCell>
                      <ProductRowActions productId={p.id} status={p.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
