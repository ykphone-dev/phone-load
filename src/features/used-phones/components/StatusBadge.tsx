import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DISPUTE_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  PRODUCT_STATUS_LABEL,
  REFUND_STATUS_LABEL,
  SELLER_STATUS_LABEL,
  type OrderStatus,
  type ProductStatus,
} from "../constants";

const ORDER_COLORS: Partial<Record<OrderStatus, string>> = {
  WAITING_DEPOSIT: "bg-amber-100 text-amber-900",
  DEPOSIT_REPORTED: "bg-orange-100 text-orange-900",
  DEPOSIT_CONFIRMED: "bg-blue-100 text-blue-900",
  PREPARING: "bg-blue-100 text-blue-900",
  SHIPPED: "bg-indigo-100 text-indigo-900",
  DELIVERED: "bg-emerald-100 text-emerald-900",
  COMPLETED: "bg-emerald-200 text-emerald-950",
  CANCEL_REQUESTED: "bg-rose-100 text-rose-900",
  CANCELLED: "bg-zinc-200 text-zinc-700",
  REFUND_REQUESTED: "bg-rose-100 text-rose-900",
  REFUNDED: "bg-zinc-200 text-zinc-700",
  DISPUTED: "bg-red-200 text-red-950",
};

const PRODUCT_COLORS: Partial<Record<ProductStatus, string>> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  ON_SALE: "bg-emerald-100 text-emerald-900",
  RESERVED: "bg-amber-100 text-amber-900",
  SOLD: "bg-zinc-800 text-white",
  STOPPED: "bg-rose-100 text-rose-900",
  DELETED: "bg-zinc-200 text-zinc-500",
};

const SELLER_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  SUSPENDED: "bg-zinc-800 text-white",
};

const NEUTRAL = "bg-zinc-100 text-zinc-800";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent rounded-sm whitespace-nowrap",
        ORDER_COLORS[status as OrderStatus] ?? NEUTRAL,
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status as OrderStatus] ?? status}
    </Badge>
  );
}

export function ProductStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent rounded-sm whitespace-nowrap",
        PRODUCT_COLORS[status as ProductStatus] ?? NEUTRAL,
        className,
      )}
    >
      {PRODUCT_STATUS_LABEL[status as ProductStatus] ?? status}
    </Badge>
  );
}

export function SellerStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent rounded-sm whitespace-nowrap",
        SELLER_COLORS[status] ?? NEUTRAL,
        className,
      )}
    >
      {SELLER_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function RefundStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent rounded-sm whitespace-nowrap", NEUTRAL)}
    >
      {REFUND_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function DisputeStatusBadge({ status }: { status: string }) {
  const color =
    status === "RESOLVED"
      ? "bg-emerald-100 text-emerald-900"
      : status === "OPEN"
        ? "bg-red-100 text-red-900"
        : "bg-amber-100 text-amber-900";
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent rounded-sm whitespace-nowrap", color)}
    >
      {DISPUTE_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function GradeBadge({
  grade,
  className,
}: {
  grade: string;
  className?: string;
}) {
  const color =
    grade === "S"
      ? "bg-violet-600 text-white"
      : grade === "A"
        ? "bg-blue-600 text-white"
        : grade === "B"
          ? "bg-emerald-600 text-white"
          : "bg-zinc-600 text-white";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-2 py-0.5 text-xs font-bold",
        color,
        className,
      )}
    >
      {grade}등급
    </span>
  );
}
