"use client";

import {
  approveSellerAction,
  reactivateSellerAction,
  rejectSellerAction,
  suspendSellerAction,
} from "../../actions/admin";
import { ActionButton } from "../ActionButton";

type Props = { sellerId: string; status: string };

/** 판매자 상세 화면 관리자 처리 버튼 (상태별) */
export function SellerAdminActions({ sellerId, status }: Props) {
  if (status === "PENDING" || status === "REJECTED") {
    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton
          action={() => approveSellerAction(sellerId)}
          confirmMessage="이 판매자의 입점을 승인하시겠습니까? 승인 즉시 상품 등록이 가능해집니다."
          successMessage="판매자를 승인했습니다."
        >
          승인
        </ActionButton>
        {status === "PENDING" && (
          <ActionButton
            variant="destructive"
            action={() => rejectSellerAction(sellerId, "")}
            promptMessage="반려 사유를 입력하세요. (판매자에게 표시됩니다)"
            onPrompt={(reason) => rejectSellerAction(sellerId, reason)}
            successMessage="입점 신청을 반려했습니다."
          >
            반려
          </ActionButton>
        )}
      </div>
    );
  }
  if (status === "APPROVED") {
    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton
          variant="destructive"
          action={() => suspendSellerAction(sellerId)}
          promptMessage="정지 사유를 입력하세요. 정지 시 판매중인 상품은 모두 판매중지 처리됩니다. (선택)"
          onPrompt={(reason) =>
            suspendSellerAction(sellerId, reason || undefined)
          }
          successMessage="판매자를 정지했습니다."
        >
          정지
        </ActionButton>
      </div>
    );
  }
  if (status === "SUSPENDED") {
    return (
      <div className="flex flex-wrap gap-2">
        <ActionButton
          action={() => reactivateSellerAction(sellerId)}
          confirmMessage="정지를 해제하시겠습니까? 판매중지된 상품은 자동으로 복구되지 않으며 판매자가 직접 다시 판매중으로 변경해야 합니다."
          successMessage="정지를 해제했습니다."
        >
          정지 해제
        </ActionButton>
      </div>
    );
  }
  return null;
}
