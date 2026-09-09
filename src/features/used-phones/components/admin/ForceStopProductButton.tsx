"use client";

import { forceStopProductAction } from "../../actions/admin";
import { ActionButton } from "../ActionButton";

type Props = {
  productId: string;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

/** 관리자 강제 판매중지 버튼 (판매중 상품에만 노출) */
export function ForceStopProductButton({ productId, size = "sm", className }: Props) {
  return (
    <ActionButton
      variant="destructive"
      size={size}
      className={className}
      action={() => forceStopProductAction(productId)}
      promptMessage="강제 판매중지 사유를 입력하세요. (감사로그에 기록됩니다)"
      onPrompt={(reason) => forceStopProductAction(productId, reason || undefined)}
      successMessage="상품을 판매중지 처리했습니다."
    >
      강제 판매중지
    </ActionButton>
  );
}
