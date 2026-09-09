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
  EmptyState,
  GradeBadge,
  ProductStatusBadge,
} from "@/features/used-phones/components";
import {
  ForceStopProductButton,
  StatusFilterLinks,
} from "@/features/used-phones/components/admin";
import {
  BRAND_LABEL,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABEL,
  type ProductStatus,
} from "@/features/used-phones/constants";
import { adminListProducts } from "@/features/used-phones/server/products";
import { formatDateTime, formatKRW } from "@/features/used-phones/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { searchParams: { [key: string]: string | string[] | undefined } };

export default async function AdminPhonesPage({ searchParams }: Props) {
  const raw =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const status = PRODUCT_STATUSES.includes(raw as ProductStatus)
    ? (raw as ProductStatus)
    : undefined;
  const products = await adminListProducts(status);

  return (
    <AdminShell
      heading="중고폰 상품"
      description="판매자가 등록한 중고폰 상품을 조회하고 필요 시 강제 판매중지합니다."
    >
      <StatusFilterLinks
        basePath="/admin/phones"
        current={status}
        options={[
          { label: "전체" },
          ...PRODUCT_STATUSES.map((s) => ({
            value: s,
            label: PRODUCT_STATUS_LABEL[s],
          })),
        ]}
      />

      {products.length === 0 ? (
        <EmptyState
          title="상품이 없습니다."
          description="조건에 해당하는 상품이 없습니다."
        />
      ) : (
        <div className="overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead>모델 / 용량 / 색상</TableHead>
                <TableHead>판매자</TableHead>
                <TableHead>등급</TableHead>
                <TableHead className="text-right">가격</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-52"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const thumb = p.images[0]?.imageUrl;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden bg-zinc-100">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={p.model}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                            없음
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/phones/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.model} {p.storage}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {BRAND_LABEL[p.brand] ?? p.brand} · {p.color}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/sellers/${p.seller.id}`}
                        className="hover:underline"
                      >
                        {p.seller.businessName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <GradeBadge grade={p.conditionGrade} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatKRW(p.price)}
                    </TableCell>
                    <TableCell>
                      <ProductStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-500">
                      {formatDateTime(p.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/phones/${p.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                          )}
                        >
                          상세
                        </Link>
                        {p.status === "ON_SALE" && (
                          <ForceStopProductButton productId={p.id} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminShell>
  );
}
