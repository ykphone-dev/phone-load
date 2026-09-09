"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSettingsAction } from "../../actions/admin";

const MIN = 5;
const MAX = 1440;

type Props = { initialMinutes: number };

/** 플랫폼 설정 폼 — 미입금 자동취소 시간(분) */
export function SettingsForm({ initialMinutes }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(String(initialMinutes));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isInteger(n) || n < MIN || n > MAX) {
      toast({
        title: "입력값이 올바르지 않습니다.",
        description: `${MIN}분 이상 ${MAX}분 이하의 정수를 입력하세요.`,
        variant: "destructive",
      });
      return;
    }
    startTransition(async () => {
      const res = await updateSettingsAction({ reservationMinutes: n });
      if (res.ok === false) {
        toast({ title: "저장 실패", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "설정을 저장했습니다." });
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-4 border p-4">
      <div className="space-y-2">
        <Label htmlFor="reservationMinutes">미입금 자동취소 시간(분)</Label>
        <Input
          id="reservationMinutes"
          type="number"
          inputMode="numeric"
          min={MIN}
          max={MAX}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          required
        />
        <p className="text-xs text-zinc-500">
          주문 후 이 시간 안에 구매자가 입금완료 표시를 하지 않으면 주문이 자동취소되고 상품은 판매중으로
          돌아갑니다. ({MIN}분 ~ {MAX}분, 현재 {initialMinutes}분)
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner className="mr-2 h-4 w-4" />}
        저장
      </Button>
    </form>
  );
}
