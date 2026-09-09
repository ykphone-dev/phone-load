import { SidebarNav } from "@/components/admin/SidebarNav";
import { SellerStatusBadge } from "@/features/used-phones/components";
import { getSessionContext } from "@/features/used-phones/server/auth";
import type { SidebarNavItem } from "@/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const NAV_ITEMS: SidebarNavItem[] = [
  { title: "대시보드", href: "/seller", icon: "layoutDashboard", items: [] },
  { title: "상품관리", href: "/seller/products", icon: "package", items: [] },
  { title: "주문관리", href: "/seller/orders", icon: "receipt", items: [] },
  { title: "판매자 정보", href: "/seller/profile", icon: "user", items: [] },
];

export default async function SellerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx.user) redirect("/sign-in?from=/seller");

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <Link href="/seller" className="text-base font-bold tracking-tight">
            옆커폰 판매자센터
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-zinc-500 sm:inline">
              {ctx.user.email}
            </span>
            <Link
              href="/products"
              className="underline-offset-4 hover:underline"
            >
              쇼핑몰로
            </Link>
          </div>
        </div>
        {/* 모바일 상단 내비게이션 */}
        <nav className="border-t md:hidden">
          <ul className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-2 py-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href!}
                  className="block whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-zinc-100"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r md:sticky md:top-14 md:block md:h-[calc(100vh-3.5rem)] md:overflow-y-auto">
          <div className="py-6 pr-4">
            {ctx.seller && (
              <div className="mb-4 rounded-md border p-3">
                <p className="truncate text-sm font-medium">
                  {ctx.seller.businessName}
                </p>
                <div className="mt-1">
                  <SellerStatusBadge status={ctx.seller.status} />
                </div>
              </div>
            )}
            <SidebarNav items={NAV_ITEMS} />
          </div>
        </aside>
        <main className="min-w-0 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
