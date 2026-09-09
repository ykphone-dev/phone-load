"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export function CopyButton({ value, label = "복사", className }: { value: string; label?: string; className?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast({ title: "복사되었습니다", description: value });
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast({ title: "복사 실패", description: "직접 선택해서 복사해주세요.", variant: "destructive" });
        }
      }}
    >
      {copied ? "복사됨" : label}
    </Button>
  );
}
