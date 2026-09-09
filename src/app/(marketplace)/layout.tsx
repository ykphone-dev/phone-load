import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  MarketFooter,
  MarketNavbar,
} from "@/features/used-phones/components/market/MarketNavbar";

export const metadata: Metadata = {
  title: "옆커폰 중고폰",
  description:
    "검증된 사업자 판매자의 중고폰을 판매자 계좌 직접 송금으로 구매하세요.",
};

export default function MarketplaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <MarketNavbar />
      <main className="container min-h-[60vh] py-6">{children}</main>
      <MarketFooter />
    </>
  );
}
