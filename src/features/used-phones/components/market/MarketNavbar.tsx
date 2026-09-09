import Link from "next/link";
import { getSessionContext } from "../../server/auth";
import { PLATFORM_NAME } from "../../constants";

/** 중고폰 마켓 상단 내비게이션 (서버 컴포넌트) */
export async function MarketNavbar() {
  const ctx = await getSessionContext();
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/products" className="text-lg font-bold tracking-tight">
            {PLATFORM_NAME}{" "}
            <span className="font-normal text-zinc-500">중고폰</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            <Link href="/products" className="hover:underline">
              상품
            </Link>
            <Link href="/order/lookup" className="hover:underline">
              주문조회
            </Link>
            {ctx.user && (
              <Link href="/my-orders" className="hover:underline">
                내 주문
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/seller"
            className="hidden text-zinc-600 hover:underline sm:inline"
          >
            {ctx.seller ? "판매자센터" : "판매자 입점"}
          </Link>
          {ctx.isAdmin && (
            <Link
              href="/admin/marketplace"
              className="hidden text-zinc-600 hover:underline sm:inline"
            >
              관리자
            </Link>
          )}
          {ctx.user ? (
            <span
              className="max-w-[140px] truncate text-zinc-500"
              title={ctx.user.email ?? ""}
            >
              {ctx.user.email}
            </span>
          ) : (
            <Link
              href="/sign-in?from=/products"
              className="font-medium hover:underline"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
      <nav className="container flex gap-4 border-t py-2 text-sm md:hidden">
        <Link href="/products">상품</Link>
        <Link href="/order/lookup">주문조회</Link>
        {ctx.user && <Link href="/my-orders">내 주문</Link>}
        <Link href="/seller">판매자</Link>
      </nav>
    </header>
  );
}

export function MarketFooter() {
  return (
    <footer className="mt-16 border-t py-8 text-xs text-zinc-500">
      <div className="container space-y-1">
        <p className="font-medium text-zinc-700">
          {PLATFORM_NAME} 중고폰 거래 플랫폼
        </p>
        <p>
          {PLATFORM_NAME}은 통신판매중개자이며 통신판매의 당사자가 아닙니다.
          상품, 거래정보 및 거래에 대한 책임은 각 판매자에게 있습니다.
        </p>
        <p>
          {PLATFORM_NAME}은 판매대금을 보관하지 않으며, 대금은 구매자가 판매자
          사업자계좌로 직접 송금합니다.
        </p>
      </div>
    </footer>
  );
}
