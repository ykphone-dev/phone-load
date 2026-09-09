import { SectionTitle } from "@/features/used-phones/components";
import { ProductForm } from "@/features/used-phones/components/seller/ProductForm";
import { guardSellerPage } from "@/features/used-phones/server/seller-guard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await guardSellerPage();
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <SectionTitle
          right={
            <Link href="/seller/products" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
              목록으로
            </Link>
          }
        >
          상품 등록
        </SectionTitle>
        <p className="text-sm text-zinc-500">
          한 화면에서 모든 항목을 입력합니다. 임시 저장하면 소비자에게 노출되지 않습니다.
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
