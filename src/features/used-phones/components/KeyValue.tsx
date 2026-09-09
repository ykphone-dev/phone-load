import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function KeyValueList({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("divide-y border-y", className)}>
      {items.map((it) => (
        <div key={it.label} className="grid grid-cols-[110px_1fr] gap-3 py-2 text-sm sm:grid-cols-[160px_1fr]">
          <dt className="text-zinc-500">{it.label}</dt>
          <dd className="break-words">{it.value ?? "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-dashed py-16 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-zinc-500">{description}</p>}
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{children}</h2>
      {right}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="border p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
