"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { setProductStatusAction } from "../../actions/products";
import { ActionButton } from "../ActionButton";

type Props = { productId: string; status: string };

/** 판매자 상품 목록 행의 액션 버튼 묶음 */
export function ProductRowActions({ productId, status }: Props) {
  const locked = status === "RESERVED" || status === "SOLD";
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {locked ? (
        <Button size="sm" variant="outline" disabled>
          수정
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline">
          <Link href={`/seller/products/${productId}/edit`}>수정</Link>
        </Button>
      )}
      {status === "ON_SALE" && (
        <ActionButton
          size="sm"
          variant="outline"
          action={() => setProductStatusAction(productId, "STOP")}
          confirmMessage="이 상품을 판매중지 하시겠습니까? 소비자에게 더 이상 노출되지 않습니다."
          successMessage="판매중지 처리되었습니다"
        >
          판매중지
        </ActionButton>
      )}
      {(status === "STOPPED" || status === "DRAFT") && (
        <ActionButton
          size="sm"
          variant="outline"
          action={() => setProductStatusAction(productId, "RESUME")}
          confirmMessage="이 상품을 판매중으로 전환하시겠습니까?"
          successMessage="판매가 시작되었습니다"
        >
          판매재개
        </ActionButton>
      )}
      {status !== "RESERVED" && (
        <ActionButton
          size="sm"
          variant="ghost"
          className="text-rose-600 hover:text-rose-700"
          action={() => setProductStatusAction(productId, "DELETE")}
          confirmMessage="상품을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다."
          successMessage="상품이 삭제되었습니다"
        >
          삭제
        </ActionButton>
      )}
    </div>
  );
}
