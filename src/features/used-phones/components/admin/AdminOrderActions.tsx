"use client";

import type { OrderStatus } from "../../constants";
import { canTransition, type TransitionKey } from "../../order-state";
import { adminTransitionAction } from "../../actions/admin";
import { ActionButton } from "../ActionButton";

type Props = { orderId: string; status: OrderStatus };

type ButtonDef = {
  key: TransitionKey;
  label: string;
  confirm: string;
  success: string;
  destructive?: boolean;
};

const BUTTONS: ButtonDef[] = [
  {
    key: "CONFIRM_DEPOSIT",
    label: "입금 확인 (판매자 대행)",
    confirm:
      "판매자를 대신해 입금을 확인 처리합니다. 실제 입금이 확인된 경우에만 진행하세요. 상품은 판매완료로 변경됩니다.",
    success: "입금 확인 처리했습니다.",
  },
  {
    key: "CANCEL_BEFORE_DEPOSIT",
    label: "주문 취소",
    confirm:
      "입금 전 주문을 취소합니다. 상품은 다시 판매중으로 돌아갑니다. 진행하시겠습니까?",
    success: "주문을 취소했습니다.",
    destructive: true,
  },
  {
    key: "EXPIRE",
    label: "기한만료 취소",
    confirm:
      "입금기한 만료로 주문을 취소합니다. 상품은 다시 판매중으로 돌아갑니다. 진행하시겠습니까?",
    success: "기한만료 취소 처리했습니다.",
    destructive: true,
  },
  {
    key: "APPROVE_CANCEL",
    label: "취소 승인",
    confirm:
      "구매자의 취소 요청을 승인합니다. 판매자가 환불을 완료했는지 확인한 후 진행하세요. 상품은 다시 판매중으로 돌아갑니다.",
    success: "취소를 승인했습니다.",
    destructive: true,
  },
  {
    key: "CONFIRM_REFUND",
    label: "환불 확인 처리",
    confirm:
      "환불이 완료된 것으로 처리합니다. 주문은 환불완료가 되고 상품은 판매중지로 변경됩니다. 진행하시겠습니까?",
    success: "환불 확인 처리했습니다.",
    destructive: true,
  },
  {
    key: "MARK_DELIVERED",
    label: "배송완료 처리",
    confirm: "이 주문을 배송완료로 변경합니다. 진행하시겠습니까?",
    success: "배송완료 처리했습니다.",
  },
  {
    key: "COMPLETE",
    label: "거래완료 처리",
    confirm:
      "구매자를 대신해 거래를 완료 처리합니다. 이후에는 환불 요청만 가능합니다. 진행하시겠습니까?",
    success: "거래완료 처리했습니다.",
  },
];

/** 주문 상세 화면 관리자 개입 버튼 모음 */
export function AdminOrderActions({ orderId, status }: Props) {
  const visible = BUTTONS.filter((b) => canTransition(b.key, status, "ADMIN"));
  return (
    <div className="space-y-2">
      {visible.length === 0 ? (
        <p className="text-sm text-zinc-500">
          현재 상태에서 관리자가 처리할 수 있는 항목이 없습니다.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {visible.map((b) => (
            <ActionButton
              key={b.key}
              variant={b.destructive ? "destructive" : "default"}
              size="sm"
              action={() => adminTransitionAction(orderId, b.key)}
              confirmMessage={b.confirm}
              successMessage={b.success}
            >
              {b.label}
            </ActionButton>
          ))}
        </div>
      )}
      <p className="text-xs text-zinc-500">
        관리자 처리 내역은 모두 감사로그에 기록됩니다.
      </p>
    </div>
  );
}
