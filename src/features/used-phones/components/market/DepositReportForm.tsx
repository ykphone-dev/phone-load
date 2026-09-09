"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reportDepositAction } from "../../actions/orders";

/** "입금했습니다" 버튼 + 입금자명 (기획서 14) */
export function DepositReportForm({ orderNumber, defaultName }: { orderNumber: string; defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const submit = () => {
    if (!name.trim()) {
      toast({ title: "입금자명을 입력하세요", variant: "destructive" });
      return;
    }
    if (!window.confirm("판매자 계좌로 입금을 완료하셨습니까?\n판매자가 실제 입금을 확인한 후 배송이 진행됩니다.")) return;
    startTransition(async () => {
      const res = await reportDepositAction(orderNumber, { depositorName: name.trim() });
      if (res.ok === false) {
        toast({ title: "처리 실패", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "입금완료를 표시했습니다", description: "판매자가 입금을 확인하면 배송이 시작됩니다." });
      router.push(`/order/${orderNumber}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="space-y-1.5">
        <Label htmlFor="depositorName">입금자명</Label>
        <Input id="depositorName" value={name} onChange={(e) => setName(e.target.value)} placeholder="통장에 찍히는 이름" />
        <p className="text-xs text-zinc-500">주문자명과 입금자명이 다르면 판매자가 확인하기 어렵습니다. 실제 입금한 이름을 적어주세요.</p>
      </div>
      <Button size="lg" className="w-full" onClick={submit} disabled={pending}>
        {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
        입금했습니다
      </Button>
    </div>
  );
}
