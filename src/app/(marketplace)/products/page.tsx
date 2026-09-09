import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, ProductCard } from "@/features/used-phones/components";
import { ProductFilters } from "@/features/used-phones/components/market/ProductFilters";
import { listPublicModels, listPublicProducts } from "@/features/used-phones/server/products";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { searchParams: Record<string, string | string[] | undefined> };

function single(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProductsPage({ searchParams }: Props) {
  const query = {
    brand: single(searchParams.brand) as any,
    model: single(searchParams.model),
    storage: single(searchParams.storage),
    grade: single(searchParams.grade) as any,
    minPrice: single(searchParams.minPrice),
    maxPrice: single(searchParams.maxPrice),
    sort: (single(searchParams.sort) as any) ?? "latest",
    page: single(searchParams.page) ?? "1",
  };

  let result: Awaited<ReturnType<typeof listPublicProducts>> | null = null;
  let models: Awaited<ReturnType<typeof listPublicModels>> = [];
  try {
    [result, models] = await Promise.all([listPublicProducts(query as any), listPublicModels()]);
  } catch {
    result = null;
  }

  const pageLink = (page: number) => {
    const sp = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      const s = single(v);
      if (s && k !== "page") sp.set(k, s);
    });
    sp.set("page", String(page));
    return `/products?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">중고폰</h1>
        <p className="text-sm text-zinc-500">
          검증된 사업자 판매자의 중고폰입니다. 대금은 판매자 계좌로 직접 송금합니다.
        </p>
      </div>

      <Suspense>
        <ProductFilters models={models} />
      </Suspense>

      {!result ? (
        <EmptyState title="상품을 불러올 수 없습니다" description="잠시 후 다시 시도해주세요." />
      ) : result.items.length === 0 ? (
        <EmptyState title="조건에 맞는 상품이 없습니다" description="필터를 변경해보세요.">
          <Link href="/products" className="text-sm underline">전체 상품 보기</Link>
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-zinc-500">총 {result.total.toLocaleString("ko-KR")}개</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {result.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {result.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1 pt-4" aria-label="페이지">
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={pageLink(n)}
                  className={cn(
                    "min-w-9 border px-3 py-1 text-center text-sm",
                    n === result!.page ? "bg-black text-white" : "hover:bg-zinc-100",
                  )}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
