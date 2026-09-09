"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buyerMarkDeliveredAction,
  cancelBeforeDepositAction,
  completeOrderAction,
  confirmRefundAction,
  requestCancelAction,
  withdrawRefundAction,
} from "../../actions/orders";
import type { OrderStatus } from "../../constants";
import { ActionButton } from "../ActionButton";
import { DisputeForm } from "./DisputeForm";
import { RefundRequestForm } from "./RefundRequestForm";

type Props = {
  orderNumber: string;
  status: OrderStatus;
  buyerName: string;
  /** 판매자가 환불완료 처리했는지 (SELLER_REFUNDED 환불요청 존재) */
  sellerRefunded: boolean;
  hasOpenDispute: boolean;
};

/** 소비자 주문 상세의 상태별 액션 버튼 */
export function BuyerOrderActions({
  orderNumber,
  status,
  buyerName,
  sellerRefunded,
  hasOpenDispute,
}: Props) {
  const cancelNow = (
    <ActionButton
      variant="outline"
      action={() => cancelBeforeDepositAction(orderNumber)}
      confirmMessage="주문을 취소하시겠습니까? 입금하셨다면 취소하지 마시고 판매자에게 연락하세요."
      successMessage="주문이 취소되었습니다"
    >
      주문 취소
    </ActionButton>
  );

  switch (status) {
    case "WAITING_DEPOSIT":
      return (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/order/${orderNumber}/payment`}
            className={cn(buttonVariants())}
          >
            계좌 안내 / 입금했습니다
          </Link>
          {cancelNow}
        </div>
      );
    case "DEPOSIT_REPORTED":
      return (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">
            판매자가 입금을 확인하면 배송이 시작됩니다.
          </p>
          {cancelNow}
        </div>
      );
    case "DEPOSIT_CONFIRMED":
    case "PREPARING":
      return (
        <ActionButton
          variant="outline"
          action={() => requestCancelAction(orderNumber)}
          promptMessage="취소 사유를 입력하세요 (판매자 확인 후 환불됩니다)"
          onPrompt={(reason) => requestCancelAction(orderNumber, { reason })}
          successMessage="취소를 요청했습니다"
        >
          취소 요청
        </ActionButton>
      );
    case "SHIPPED":
      return (
        <div className="flex flex-wrap gap-2">
          <ActionButton
            variant="outline"
            action={() => buyerMarkDeliveredAction(orderNumber)}
            confirmMessage="상품을 받으셨습니까?"
            successMessage="배송완료로 표시했습니다"
          >
            배송 받았습니다
          </ActionButton>
          <ActionButton
            action={() => completeOrderAction(orderNumber)}
            confirmMessage="구매를 확정하시겠습니까? 확정 후에는 환불 요청만 가능합니다."
            successMessage="구매가 확정되었습니다"
          >
            구매확정
          </ActionButton>
          <RefundRequestForm orderNumber={orderNumber} buyerName={buyerName} />
        </div>
      );
    case "DELIVERED":
      return (
        <div className="flex flex-wrap gap-2">
          <ActionButton
            action={() => completeOrderAction(orderNumber)}
            confirmMessage="구매를 확정하시겠습니까?"
            successMessage="구매가 확정되었습니다"
          >
            구매확정
          </ActionButton>
          <RefundRequestForm orderNumber={orderNumber} buyerName={buyerName} />
          <DisputeForm orderNumber={orderNumber} />
        </div>
      );
    case "COMPLETED":
      return (
        <div className="flex flex-wrap gap-2">
          <RefundRequestForm orderNumber={orderNumber} buyerName={buyerName} />
          {!hasOpenDispute && <DisputeForm orderNumber={orderNumber} />}
        </div>
      );
    case "REFUND_REQUESTED":
      return (
        <div className="space-y-3">
          {sellerRefunded ? (
            <p className="text-sm text-emerald-700">
              판매자가 환불완료 처리했습니다. 환불금을 받으셨다면 확인 버튼을
              눌러주세요.
            </p>
          ) : (
            <p className="text-sm text-zinc-600">
              판매자가 환불 요청을 확인 중입니다.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {sellerRefunded && (
              <ActionButton
                action={() => confirmRefundAction(orderNumber)}
                confirmMessage="환불금 입금을 확인하셨습니까?"
                successMessage="환불이 완료되었습니다"
              >
                환불금 확인
              </ActionButton>
            )}
            <ActionButton
              variant="outline"
              action={() => withdrawRefundAction(orderNumber)}
              confirmMessage="환불 요청을 철회하시겠습니까?"
              successMessage="환불 요청을 철회했습니다"
            >
              요청 철회
            </ActionButton>
            <DisputeForm orderNumber={orderNumber} />
          </div>
        </div>
      );
    case "CANCEL_REQUESTED":
      return (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            판매자가 취소 요청을 확인 중입니다. 판매자가 환불 후 취소를
            승인합니다.
          </p>
          <DisputeForm orderNumber={orderNumber} />
        </div>
      );
    case "DISPUTED":
      return (
        <p className="text-sm text-rose-700">
          분쟁이 접수되어 옆커폰 관리자가 처리 중입니다. 처리 결과는 이
          페이지에서 확인할 수 있습니다.
        </p>
      );
    case "CANCELLED":
    case "REFUNDED":
      return <p className="text-sm text-zinc-500">종료된 주문입니다.</p>;
    default:
      return null;
  }
}
