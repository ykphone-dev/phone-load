import {
  DISPUTE_RESOLUTIONS,
  OrderTransitionError,
  TRANSITIONS,
  canTransition,
  isTerminal,
  nextStatus,
  progressIndex,
} from "../order-state";
import type { OrderStatus } from "../constants";

describe("주문 상태 머신", () => {
  test("입금 표시(REPORT_DEPOSIT)는 구매자만, 입금 대기 상태에서만 가능하다", () => {
    expect(canTransition("REPORT_DEPOSIT", "WAITING_DEPOSIT", "BUYER")).toBe(
      true,
    );
    expect(canTransition("REPORT_DEPOSIT", "WAITING_DEPOSIT", "SELLER")).toBe(
      false,
    );
    expect(canTransition("REPORT_DEPOSIT", "DEPOSIT_CONFIRMED", "BUYER")).toBe(
      false,
    );
  });

  test("가장 중요한 원칙: 구매자는 절대 입금 확인(DEPOSIT_CONFIRMED)으로 넘길 수 없다", () => {
    expect(canTransition("CONFIRM_DEPOSIT", "DEPOSIT_REPORTED", "BUYER")).toBe(
      false,
    );
    expect(canTransition("CONFIRM_DEPOSIT", "WAITING_DEPOSIT", "BUYER")).toBe(
      false,
    );
    expect(() =>
      nextStatus("CONFIRM_DEPOSIT", "DEPOSIT_REPORTED", "BUYER"),
    ).toThrow(OrderTransitionError);
    // 구매자가 도달 가능한 전이 중 목적지가 DEPOSIT_CONFIRMED/SHIPPED 인 것은 없다
    const buyerTargets = Object.values(TRANSITIONS)
      .filter((r) => r.actors.includes("BUYER"))
      .map((r) => r.to);
    expect(buyerTargets).not.toContain("DEPOSIT_CONFIRMED");
    expect(buyerTargets).not.toContain("SHIPPED");
  });

  test("판매자 입금 확인 → 배송 → 배송완료 → 구매확정 정상 흐름", () => {
    let s: OrderStatus = "WAITING_DEPOSIT";
    s = nextStatus("REPORT_DEPOSIT", s, "BUYER");
    expect(s).toBe("DEPOSIT_REPORTED");
    s = nextStatus("CONFIRM_DEPOSIT", s, "SELLER");
    expect(s).toBe("DEPOSIT_CONFIRMED");
    s = nextStatus("SHIP", s, "SELLER");
    expect(s).toBe("SHIPPED");
    s = nextStatus("MARK_DELIVERED", s, "SELLER");
    expect(s).toBe("DELIVERED");
    s = nextStatus("COMPLETE", s, "BUYER");
    expect(s).toBe("COMPLETED");
    expect(isTerminal(s)).toBe(true);
  });

  test("판매자는 구매자 표시 없이도 직접 통장 확인 후 입금 확인할 수 있다", () => {
    expect(nextStatus("CONFIRM_DEPOSIT", "WAITING_DEPOSIT", "SELLER")).toBe(
      "DEPOSIT_CONFIRMED",
    );
  });

  test("판매자가 배송 단계에서 취소하거나 되돌릴 수 없다", () => {
    expect(canTransition("CANCEL_BEFORE_DEPOSIT", "SHIPPED", "SELLER")).toBe(
      false,
    );
    expect(canTransition("UNCONFIRM_DEPOSIT", "SHIPPED", "SELLER")).toBe(false);
  });

  test("입금 후 취소는 요청 → 판매자 승인/거절, 거절 시 이전 상태로 복원", () => {
    expect(nextStatus("REQUEST_CANCEL", "DEPOSIT_CONFIRMED", "BUYER")).toBe(
      "CANCEL_REQUESTED",
    );
    expect(nextStatus("APPROVE_CANCEL", "CANCEL_REQUESTED", "SELLER")).toBe(
      "CANCELLED",
    );
    expect(
      nextStatus("REJECT_CANCEL", "CANCEL_REQUESTED", "SELLER", {
        restoreTo: "PREPARING",
      }),
    ).toBe("PREPARING");
    expect(nextStatus("REJECT_CANCEL", "CANCEL_REQUESTED", "SELLER")).toBe(
      "DEPOSIT_CONFIRMED",
    );
  });

  test("환불: 요청 → 구매자 확인 시 REFUNDED, 철회 시 복원", () => {
    expect(nextStatus("REQUEST_REFUND", "DELIVERED", "BUYER")).toBe(
      "REFUND_REQUESTED",
    );
    expect(nextStatus("REQUEST_REFUND", "COMPLETED", "BUYER")).toBe(
      "REFUND_REQUESTED",
    );
    expect(nextStatus("CONFIRM_REFUND", "REFUND_REQUESTED", "BUYER")).toBe(
      "REFUNDED",
    );
    expect(
      nextStatus("WITHDRAW_REFUND", "REFUND_REQUESTED", "BUYER", {
        restoreTo: "COMPLETED",
      }),
    ).toBe("COMPLETED");
    expect(nextStatus("WITHDRAW_REFUND", "REFUND_REQUESTED", "BUYER")).toBe(
      "DELIVERED",
    );
    // 판매자는 환불 요청을 REFUNDED 로 직접 바꿀 수 없다 (구매자 확인 필요)
    expect(canTransition("CONFIRM_REFUND", "REFUND_REQUESTED", "SELLER")).toBe(
      false,
    );
  });

  test("만료 자동취소는 입금 대기 상태에서만, 시스템/관리자만", () => {
    expect(canTransition("EXPIRE", "WAITING_DEPOSIT", "SYSTEM")).toBe(true);
    expect(canTransition("EXPIRE", "DEPOSIT_REPORTED", "SYSTEM")).toBe(false);
    expect(canTransition("EXPIRE", "WAITING_DEPOSIT", "BUYER")).toBe(false);
  });

  test("분쟁: 구매자만 열 수 있고, 관리자만 결과를 정해 종료한다", () => {
    expect(nextStatus("OPEN_DISPUTE", "REFUND_REQUESTED", "BUYER")).toBe(
      "DISPUTED",
    );
    expect(canTransition("OPEN_DISPUTE", "REFUND_REQUESTED", "SELLER")).toBe(
      false,
    );
    expect(() => nextStatus("RESOLVE_DISPUTE", "DISPUTED", "ADMIN")).toThrow(
      /관리자 처리 결과/,
    );
    for (const r of DISPUTE_RESOLUTIONS) {
      expect(
        nextStatus("RESOLVE_DISPUTE", "DISPUTED", "ADMIN", { adminChoice: r }),
      ).toBe(r);
    }
  });

  test("관리자는 어떤 전이든 실행할 수 있다 (from 조건은 유지)", () => {
    expect(canTransition("REPORT_DEPOSIT", "WAITING_DEPOSIT", "ADMIN")).toBe(
      true,
    );
    expect(canTransition("REPORT_DEPOSIT", "SHIPPED", "ADMIN")).toBe(false);
  });

  test("진행 타임라인 인덱스", () => {
    expect(progressIndex("WAITING_DEPOSIT")).toBe(0);
    expect(progressIndex("PREPARING")).toBe(progressIndex("DEPOSIT_CONFIRMED"));
    expect(progressIndex("COMPLETED")).toBe(5);
    expect(progressIndex("DISPUTED")).toBe(-1);
  });
});
