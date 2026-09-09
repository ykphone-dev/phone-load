import { handle } from "@/features/used-phones/server/api";
import {
  getSessionContext,
  requireApprovedSeller,
  requireUser,
} from "@/features/used-phones/server/auth";
import { AppError, forbidden } from "@/features/used-phones/server/errors";
import { getBuyerOrderView } from "@/features/used-phones/server/orders";
import {
  uploadPrivateDocument,
  uploadPublicImage,
} from "@/features/used-phones/server/storage";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILES = 15;

/**
 * multipart/form-data
 *  - scope: "product" | "seller-doc" | "evidence"
 *  - orderNumber: evidence 일 때 필수 (해당 주문 접근 권한 확인)
 *  - files: File[]
 *
 * 응답: { ok, data: { urls: string[] } }  (seller-doc 은 비공개 경로)
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const form = await request.formData();
    const scope = String(form.get("scope") ?? "");
    const files = form
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) throw new AppError("업로드할 파일이 없습니다.");
    if (files.length > MAX_FILES)
      throw new AppError(
        `한 번에 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`,
      );

    if (scope === "product") {
      const { seller } = await requireApprovedSeller();
      const urls = await Promise.all(
        files.map((f) => uploadPublicImage(f, `products/${seller.id}`)),
      );
      return { urls };
    }

    if (scope === "seller-doc") {
      const user = await requireUser();
      const paths = await Promise.all(
        files.map((f) => uploadPrivateDocument(f, `sellers/${user.id}`)),
      );
      return { urls: paths };
    }

    if (scope === "evidence") {
      const orderNumber = String(form.get("orderNumber") ?? "");
      if (!orderNumber) throw new AppError("주문번호가 필요합니다.");
      // 접근 권한이 없으면 403 을 던진다
      const order = await getBuyerOrderView(orderNumber);
      const urls = await Promise.all(
        files.map((f) => uploadPublicImage(f, `evidence/${order.id}`)),
      );
      return { urls };
    }

    const ctx = await getSessionContext();
    if (!ctx.isAdmin) throw forbidden("허용되지 않은 업로드 범위입니다.");
    const urls = await Promise.all(
      files.map((f) => uploadPublicImage(f, "admin")),
    );
    return { urls };
  }, 201);
}
