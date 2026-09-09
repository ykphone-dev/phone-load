"use client";

import { useEffect, useState } from "react";

/** 입금기한 카운트다운. reservedUntil 은 ISO 문자열. */
export function DepositCountdown({ reservedUntil }: { reservedUntil: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!reservedUntil) return null;
  const diff = new Date(reservedUntil).getTime() - now;
  if (diff <= 0) {
    return <span className="font-semibold text-rose-600">입금 기한이 지났습니다. 주문이 자동취소됩니다.</span>;
  }
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span className="tabular-nums">
      남은 시간 <strong>{m}분 {String(s).padStart(2, "0")}초</strong>
    </span>
  );
}
