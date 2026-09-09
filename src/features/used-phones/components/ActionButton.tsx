"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "../server/errors";

type Props = Omit<ButtonProps, "onClick"> & {
  /** 서버 액션 호출. 성공 시 router.refresh() */
  action: () => Promise<ActionResult<any>>;
  /** 확인창 문구. 없으면 바로 실행 */
  confirmMessage?: string;
  /** 성공 토스트 */
  successMessage?: string;
  /** 성공 후 이동할 경로 */
  redirectTo?: string;
  /** 입력값을 prompt 로 받아서 넘길 때 */
  promptMessage?: string;
  onPrompt?: (value: string) => Promise<ActionResult<any>>;
};

/**
 * 한 번 클릭으로 서버 액션을 실행하는 버튼.
 * 감사로그가 남는 상태 변경은 모두 confirmMessage 를 주는 것을 권장.
 */
export function ActionButton({
  action,
  confirmMessage,
  successMessage,
  redirectTo,
  promptMessage,
  onPrompt,
  children,
  disabled,
  ...rest
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const run = () => {
    let promptValue: string | null = null;
    if (promptMessage && onPrompt) {
      promptValue = window.prompt(promptMessage);
      if (promptValue === null) return;
    } else if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }
    startTransition(async () => {
      const res = promptValue !== null && onPrompt ? await onPrompt(promptValue) : await action();
      if (res.ok === false) {
        toast({ title: "처리 실패", description: res.error, variant: "destructive" });
        return;
      }
      setDone(true);
      if (successMessage) toast({ title: successMessage });
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <Button type="button" onClick={run} disabled={disabled || pending || done} {...rest}>
      {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
