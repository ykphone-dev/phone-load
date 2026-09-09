"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  sellerApproveCancelAction,
  sellerCancelAction,
  sellerConfirmDepositAction,
  sellerDecideRefundAction,
  sellerMarkDeliveredAction,
  sellerRejectCancelAction,
  sellerReplyDisputeAction,
  sellerStartPreparingAction,
  sellerUnconfirmDepositAction,
} from "../../actions/seller-orders";
import { ORDER_STATUS_LABEL, type OrderStatus } from "../../constants";
import { disputeSellerReplySchema } from "../../validations";
import { ActionButton } from "../ActionButton";
import { ShipmentForm } from "./ShipmentForm";

export type SellerOrderActionsProps = {
  orderId: string;
  status: OrderStatus;
  /** 처리 대기 중인 환불 요청 (직렬화된 값) */
  activeRefund: {
    status: string;
    refundBankName: string;
    refundAccount: string;
    refundHolder: string;
  } | null;
  /** 진행 중인 분쟁 */
  openDispute: { id: string; sellerReply: string | null } | null;
};

function Box({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {desc && <p className="mt-1 text-xs text-zinc-500">{desc}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function SellerOrderActions({
  orderId,
  status,
  activeRefund,
  openDispute,
}: SellerOrderActionsProps) {
  switch (status) {
    case "WAITING_DEPOSIT":
    case "DEPOSIT_REPORTED":
      return (
        <Box
          title="입금 확인"
          desc="반드시 실제 계좌 입금내역을 확인한 뒤 눌러주세요. 구매자의 '입금했습니다' 표시만으로는 배송 단계로 넘어가지 않습니다."
        >
          <ActionButton
            action={() => sellerConfirmDepositAction(orderId)}
            confirmMessage="실제 계좌에 입금을 확인하셨습니까? 확인 후 상품은 판매완료 처리됩니다."
            successMessage="입금이 확인되었습니다"
          >
            입금 확인
          </ActionButton>
          {status === "DEPOSIT_REPORTED" && (
            <ActionButton
              variant="outline"
              action={() => sellerUnconfirmDepositAction(orderId)}
              confirmMessage="입금이 확인되지 않아 다시 입금 대기 상태로 되돌리시겠습니까? 입금기한이 다시 부여됩니다."
              successMessage="입금 대기 상태로 변경되었습니다"
            >
              입금 미확인 (다시 대기)
            </ActionButton>
          )}
          <ActionButton
            variant="ghost"
            className="text-rose-600 hover:text-rose-700"
            action={() => sellerCancelAction(orderId)}
            promptMessage="주문 취소 사유를 입력하세요 (구매자에게 표시됩니다)"
            onPrompt={(reason) => sellerCancelAction(orderId, reason)}
            successMessage="주문이 취소되었습니다"
          >
            주문 취소
          </ActionButton>
        </Box>
      );

    case "DEPOSIT_CONFIRMED":
      return (
        <div className="space-y-3">
          <Box
            title="배송 준비"
            desc="상품 포장 등 준비 단계로 변경하거나, 바로 송장을 등록할 수 있습니다."
          >
            <ActionButton
              variant="outline"
              action={() => sellerStartPreparingAction(orderId)}
              successMessage="배송 준비중으로 변경되었습니다"
            >
              배송 준비중으로 변경
            </ActionButton>
          </Box>
          <ShipmentForm orderId={orderId} />
        </div>
      );

    case "PREPARING":
      return <ShipmentForm orderId={orderId} />;

    case "SHIPPED":
      return (
        <Box
          title="배송 완료"
          desc="택배 추적에서 배송완료가 확인되면 처리해주세요. 구매자도 직접 처리할 수 있습니다."
        >
          <ActionButton
            action={() => sellerMarkDeliveredAction(orderId)}
            confirmMessage="배송완료로 처리하시겠습니까?"
            successMessage="배송완료 처리되었습니다"
          >
            배송완료 처리
          </ActionButton>
        </Box>
      );

    case "CANCEL_REQUESTED":
      return (
        <Box
          title="취소 요청 처리"
          desc="구매자가 입금 후 취소를 요청했습니다. 구매자 계좌로 환불을 완료한 뒤 '취소 승인'을 눌러주세요. 옆커폰은 환불금을 대신 처리하지 않습니다."
        >
          <ActionButton
            action={() => sellerApproveCancelAction(orderId)}
            confirmMessage="구매자에게 환불을 완료하셨습니까? 승인 시 주문은 취소되고 상품은 다시 판매중으로 전환됩니다."
            successMessage="취소가 승인되었습니다"
          >
            환불 완료 → 취소 승인
          </ActionButton>
          <ActionButton
            variant="outline"
            action={() => sellerRejectCancelAction(orderId)}
            promptMessage="취소 거절 사유를 입력하세요"
            onPrompt={(note) => sellerRejectCancelAction(orderId, note)}
            successMessage="취소 요청을 거절했습니다"
          >
            취소 거절
          </ActionButton>
        </Box>
      );

    case "REFUND_REQUESTED":
      if (!activeRefund) {
        return (
          <Box
            title="환불 요청"
            desc="처리할 환불 요청이 없습니다. 구매자의 환불금 확인을 기다리는 중일 수 있습니다."
          >
            <span />
          </Box>
        );
      }
      return (
        <Box
          title="환불 요청 처리"
          desc={`환불 계좌: ${activeRefund.refundBankName} ${activeRefund.refundAccount} (${activeRefund.refundHolder}). 환불금을 직접 송금한 뒤 '환불 완료'를 누르면 구매자 확인을 기다립니다.`}
        >
          <ActionButton
            action={() =>
              sellerDecideRefundAction(orderId, { decision: "REFUNDED" })
            }
            confirmMessage="구매자 계좌로 환불금을 보내셨습니까?"
            successMessage="환불 완료로 표시했습니다. 구매자 확인을 기다립니다."
          >
            환불 완료
          </ActionButton>
          <ActionButton
            variant="outline"
            action={() =>
              sellerDecideRefundAction(orderId, { decision: "REJECTED" })
            }
            promptMessage="환불 거절 사유를 입력하세요 (구매자에게 표시됩니다)"
            onPrompt={(note) =>
              sellerDecideRefundAction(orderId, { decision: "REJECTED", note })
            }
            successMessage="환불 요청을 거절했습니다"
          >
            환불 거절
          </ActionButton>
        </Box>
      );

    case "DISPUTED":
      return <DisputeReply orderId={orderId} openDispute={openDispute} />;

    default:
      return (
        <div className="border p-4 text-sm text-zinc-500">
          현재 상태(<b>{ORDER_STATUS_LABEL[status] ?? status}</b>)에서는
          판매자가 처리할 작업이 없습니다.
        </div>
      );
  }
}

function DisputeReply({
  orderId,
  openDispute,
}: {
  orderId: string;
  openDispute: SellerOrderActionsProps["openDispute"];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!openDispute) {
    return (
      <div className="border p-4 text-sm text-zinc-500">
        진행 중인 분쟁이 없습니다.
      </div>
    );
  }
  if (openDispute.sellerReply) {
    return (
      <div className="space-y-2 border p-4 text-sm">
        <p className="font-medium">분쟁 답변 완료</p>
        <p className="whitespace-pre-wrap text-zinc-700">
          {openDispute.sellerReply}
        </p>
        <p className="text-xs text-zinc-500">
          관리자가 양측 의견을 검토한 뒤 처리 결과를 결정합니다.
        </p>
      </div>
    );
  }

  const submit = () => {
    const parsed = disputeSellerReplySchema.safeParse({ reply });
    if (parsed.success === false) {
      setError(parsed.error.issues[0]?.message ?? "답변을 입력하세요");
      return;
    }
    setError(null);
    const data = parsed.data as { reply: string };
    startTransition(async () => {
      const res = await sellerReplyDisputeAction(orderId, data);
      if (res.ok === false) {
        toast({
          title: "답변 등록 실패",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "분쟁 답변이 등록되었습니다" });
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 border p-4">
      <div>
        <p className="text-sm font-medium">분쟁 답변</p>
        <p className="mt-1 text-xs text-zinc-500">
          구매자가 문제가 해결되지 않았다고 신고했습니다. 사실관계와 판매자
          입장을 구체적으로 적어주세요. 관리자가 최종 판단합니다.
        </p>
      </div>
      <Textarea
        rows={5}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="답변 내용"
        maxLength={3000}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex justify-end">
        <Button type="button" onClick={submit} disabled={pending}>
          {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
          답변 등록
        </Button>
      </div>
    </div>
  );
}
