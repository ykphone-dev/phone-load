import type { OrderStatus } from "./constants";

/**
 * 주문 상태 머신.
 *
 * 가장 중요한 원칙 (기획서 15):
 *   소비자가 "입금했습니다" 를 누른 것(DEPOSIT_REPORTED)과
 *   판매자가 "실제 입금 확인" 한 것(DEPOSIT_CONFIRMED)은 반드시 분리한다.
 *   소비자 버튼만으로는 절대 배송 단계로 넘어갈 수 없다.
 */

export type Actor = "BUYER" | "SELLER" | "ADMIN" | "SYSTEM";

export type TransitionKey =
  | "REPORT_DEPOSIT" // 구매자: 입금했습니다
  | "CONFIRM_DEPOSIT" // 판매자: 실제 입금 확인
  | "UNCONFIRM_DEPOSIT" // 판매자: 입금 확인 안 됨 → 다시 대기
  | "START_PREPARING" // 판매자: 배송 준비
  | "SHIP" // 판매자: 송장 등록
  | "MARK_DELIVERED" // 판매자/구매자: 배송완료
  | "COMPLETE" // 구매자: 구매확정
  | "CANCEL_BEFORE_DEPOSIT" // 구매자: 입금 전 즉시 취소
  | "EXPIRE" // 시스템: 입금기한 만료 자동취소
  | "REQUEST_CANCEL" // 구매자: 입금 후 취소 요청
  | "APPROVE_CANCEL" // 판매자: 환불 후 취소 승인
  | "REJECT_CANCEL" // 판매자: 취소 거절 → 이전 상태 복원
  | "REQUEST_REFUND" // 구매자: 환불 요청
  | "WITHDRAW_REFUND" // 구매자: 환불 요청 철회 → 이전 상태 복원
  | "CONFIRM_REFUND" // 구매자: 환불금 확인
  | "OPEN_DISPUTE" // 구매자: 문제가 해결되지 않았습니다
  | "RESOLVE_DISPUTE"; // 관리자: 분쟁 종료

type Rule = {
  from: OrderStatus[];
  to: OrderStatus | "RESTORE" | "ADMIN_CHOICE";
  actors: Actor[];
};

export const TRANSITIONS: Record<TransitionKey, Rule> = {
  REPORT_DEPOSIT: {
    from: ["WAITING_DEPOSIT"],
    to: "DEPOSIT_REPORTED",
    actors: ["BUYER"],
  },
  CONFIRM_DEPOSIT: {
    // 판매자가 직접 통장을 확인했다면 구매자 표시 전이라도 확인 가능
    from: ["WAITING_DEPOSIT", "DEPOSIT_REPORTED"],
    to: "DEPOSIT_CONFIRMED",
    actors: ["SELLER", "ADMIN"],
  },
  UNCONFIRM_DEPOSIT: {
    from: ["DEPOSIT_REPORTED"],
    to: "WAITING_DEPOSIT",
    actors: ["SELLER", "ADMIN"],
  },
  START_PREPARING: {
    from: ["DEPOSIT_CONFIRMED"],
    to: "PREPARING",
    actors: ["SELLER", "ADMIN"],
  },
  SHIP: {
    from: ["DEPOSIT_CONFIRMED", "PREPARING"],
    to: "SHIPPED",
    actors: ["SELLER", "ADMIN"],
  },
  MARK_DELIVERED: {
    from: ["SHIPPED"],
    to: "DELIVERED",
    actors: ["SELLER", "BUYER", "ADMIN"],
  },
  COMPLETE: {
    from: ["SHIPPED", "DELIVERED"],
    to: "COMPLETED",
    actors: ["BUYER", "ADMIN"],
  },
  CANCEL_BEFORE_DEPOSIT: {
    from: ["WAITING_DEPOSIT", "DEPOSIT_REPORTED"],
    to: "CANCELLED",
    actors: ["BUYER", "SELLER", "ADMIN"],
  },
  EXPIRE: {
    from: ["WAITING_DEPOSIT"],
    to: "CANCELLED",
    actors: ["SYSTEM", "ADMIN"],
  },
  REQUEST_CANCEL: {
    from: ["DEPOSIT_CONFIRMED", "PREPARING"],
    to: "CANCEL_REQUESTED",
    actors: ["BUYER"],
  },
  APPROVE_CANCEL: {
    from: ["CANCEL_REQUESTED"],
    to: "CANCELLED",
    actors: ["SELLER", "ADMIN"],
  },
  REJECT_CANCEL: {
    from: ["CANCEL_REQUESTED"],
    to: "RESTORE",
    actors: ["SELLER", "ADMIN"],
  },
  REQUEST_REFUND: {
    from: ["SHIPPED", "DELIVERED", "COMPLETED"],
    to: "REFUND_REQUESTED",
    actors: ["BUYER"],
  },
  WITHDRAW_REFUND: {
    from: ["REFUND_REQUESTED"],
    to: "RESTORE",
    actors: ["BUYER"],
  },
  CONFIRM_REFUND: {
    from: ["REFUND_REQUESTED"],
    to: "REFUNDED",
    actors: ["BUYER", "ADMIN"],
  },
  OPEN_DISPUTE: {
    from: ["REFUND_REQUESTED", "CANCEL_REQUESTED", "DELIVERED", "COMPLETED"],
    to: "DISPUTED",
    actors: ["BUYER"],
  },
  RESOLVE_DISPUTE: {
    from: ["DISPUTED"],
    to: "ADMIN_CHOICE",
    actors: ["ADMIN"],
  },
};

export class OrderTransitionError extends Error {
  constructor(
    public readonly key: TransitionKey,
    public readonly from: OrderStatus,
    public readonly actor: Actor,
    message?: string,
  ) {
    super(message ?? `현재 상태(${from})에서는 처리할 수 없는 요청입니다.`);
    this.name = "OrderTransitionError";
  }
}

export function canTransition(
  key: TransitionKey,
  from: OrderStatus,
  actor: Actor,
): boolean {
  const rule = TRANSITIONS[key];
  if (!rule) return false;
  if (!rule.from.includes(from)) return false;
  // ADMIN 은 모든 전이 가능 (관리자 개입)
  if (actor === "ADMIN") return true;
  return rule.actors.includes(actor);
}

/**
 * 다음 상태를 계산한다.
 * - RESTORE: statusBeforeRequest 로 복원 (없으면 fallback)
 * - ADMIN_CHOICE: 관리자가 지정한 상태
 */
export function nextStatus(
  key: TransitionKey,
  from: OrderStatus,
  actor: Actor,
  opts: { restoreTo?: OrderStatus | null; adminChoice?: OrderStatus } = {},
): OrderStatus {
  if (!canTransition(key, from, actor)) {
    throw new OrderTransitionError(key, from, actor);
  }
  const rule = TRANSITIONS[key];
  if (rule.to === "RESTORE") {
    return (
      opts.restoreTo ??
      (key === "WITHDRAW_REFUND" ? "DELIVERED" : "DEPOSIT_CONFIRMED")
    );
  }
  if (rule.to === "ADMIN_CHOICE") {
    if (!opts.adminChoice) {
      throw new OrderTransitionError(
        key,
        from,
        actor,
        "관리자 처리 결과 상태가 필요합니다.",
      );
    }
    return opts.adminChoice;
  }
  return rule.to;
}

/** 관리자가 분쟁을 종료하며 선택할 수 있는 주문 최종 상태 */
export const DISPUTE_RESOLUTIONS: OrderStatus[] = [
  "COMPLETED",
  "REFUNDED",
  "CANCELLED",
];

/** 상태가 "종결" 인지 */
export function isTerminal(status: OrderStatus) {
  return ["COMPLETED", "CANCELLED", "REFUNDED"].includes(status);
}

/** 소비자 화면 진행 단계 (타임라인 표시용) */
export const PROGRESS_STEPS: OrderStatus[] = [
  "WAITING_DEPOSIT",
  "DEPOSIT_REPORTED",
  "DEPOSIT_CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
];

export function progressIndex(status: OrderStatus) {
  if (status === "PREPARING")
    return PROGRESS_STEPS.indexOf("DEPOSIT_CONFIRMED");
  return PROGRESS_STEPS.indexOf(status);
}
