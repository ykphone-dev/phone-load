"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resolveDisputeAction } from "../../actions/admin";
import type { OrderStatus } from "../../constants";
import { DISPUTE_RESOLUTIONS } from "../../order-state";

const RESOLUTION_LABEL: Record<string, string> = {
  COMPLETED: "거래완료로 종결",
  REFUNDED: "환불완료로 종결",
  CANCELLED: "취소완료로 종결",
};

const RESOLUTION_HELP: Record<string, string> = {
  COMPLETED:
    "구매자 주장이 받아들여지지 않은 경우. 주문은 거래완료가 되고 상품은 판매완료 상태를 유지합니다.",
  REFUNDED:
    "판매자가 환불한 것으로 종결. 주문은 환불완료가 되고 상품은 판매중지로 변경됩니다.",
  CANCELLED:
    "거래 자체를 취소. 주문은 취소완료가 되고 상품은 판매중으로 복귀합니다.",
};

type Props = { disputeId: string };

/** 분쟁 처리 폼 (미처리 분쟁에만 표시) */
export function DisputeResolveForm({ disputeId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [adminNote, setAdminNote] = useState("");
  const [resolution, setResolution] = useState<OrderStatus | "">("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!adminNote.trim()) {
      toast({ title: "처리 메모를 입력하세요.", variant: "destructive" });
      return;
    }
    if (!resolution) {
      toast({ title: "처리 결과를 선택하세요.", variant: "destructive" });
      return;
    }
    if (
      !window.confirm(
        `분쟁을 "${RESOLUTION_LABEL[resolution]}" 로 처리합니다.\n${RESOLUTION_HELP[resolution]}\n\n처리 후에는 되돌릴 수 없습니다. 진행하시겠습니까?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await resolveDisputeAction(disputeId, {
        adminNote: adminNote.trim(),
        resolutionStatus: resolution,
      });
      if (res.ok === false) {
        toast({
          title: "처리 실패",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      setDone(true);
      toast({ title: "분쟁을 처리했습니다." });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 border p-4">
      <div className="space-y-2">
        <Label htmlFor="adminNote">처리 메모</Label>
        <Textarea
          id="adminNote"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="처리 근거와 양측에 전달할 내용을 입력하세요. (구매자·판매자에게 표시됩니다)"
          rows={5}
          maxLength={3000}
          disabled={pending || done}
        />
      </div>
      <div className="space-y-2">
        <Label>처리 결과</Label>
        <Select
          value={resolution}
          onValueChange={(v) => setResolution(v as OrderStatus)}
          disabled={pending || done}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="처리 결과를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {DISPUTE_RESOLUTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {RESOLUTION_LABEL[r] ?? r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ul className="space-y-1 text-xs text-zinc-500">
          {DISPUTE_RESOLUTIONS.map((r) => (
            <li
              key={r}
              className={
                resolution === r ? "font-medium text-zinc-900" : undefined
              }
            >
              <span className="font-medium">{RESOLUTION_LABEL[r]}</span>:{" "}
              {RESOLUTION_HELP[r]}
            </li>
          ))}
        </ul>
      </div>
      <Button type="button" onClick={submit} disabled={pending || done}>
        {pending && <Spinner className="mr-2 h-4 w-4" />}
        분쟁 처리 확정
      </Button>
      <p className="text-xs text-zinc-500">
        관리자 처리 내역은 모두 감사로그에 기록됩니다.
      </p>
    </div>
  );
}
