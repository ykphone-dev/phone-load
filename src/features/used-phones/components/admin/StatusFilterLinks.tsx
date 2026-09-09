import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  basePath: string;
  /** value 가 undefined 면 "전체" */
  options: { value?: string; label: string }[];
  current?: string;
};

/** 목록 상단 상태 필터 링크 (서버 컴포넌트 안전) */
export function StatusFilterLinks({ basePath, options, current }: Props) {
  return (
    <nav
      className="mb-4 flex flex-wrap gap-1 border-b pb-3"
      aria-label="상태 필터"
    >
      {options.map((o) => {
        const active = (o.value ?? "") === (current ?? "");
        return (
          <Link
            key={o.value ?? "ALL"}
            href={o.value ? `${basePath}?status=${o.value}` : basePath}
            className={cn(
              "rounded-sm px-3 py-1 text-sm",
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
