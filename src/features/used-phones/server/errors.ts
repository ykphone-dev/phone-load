export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const unauthorized = (msg = "로그인이 필요합니다.") =>
  new AppError(msg, 401, "UNAUTHORIZED");
export const forbidden = (msg = "권한이 없습니다.") =>
  new AppError(msg, 403, "FORBIDDEN");
export const notFound = (msg = "찾을 수 없습니다.") =>
  new AppError(msg, 404, "NOT_FOUND");
export const conflict = (msg: string) => new AppError(msg, 409, "CONFLICT");

/** 서버 액션/라우트 공용 응답 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; status?: number };

export function toActionError(err: unknown): ActionResult<never> {
  if (err instanceof AppError) {
    return { ok: false, error: err.message, code: err.code, status: err.status };
  }
  if (err && typeof err === "object" && "name" in err && (err as any).name === "OrderTransitionError") {
    return { ok: false, error: (err as Error).message, code: "INVALID_TRANSITION", status: 409 };
  }
  if (err && typeof err === "object" && "issues" in err) {
    // zod
    const issues = (err as any).issues as { message: string }[];
    return { ok: false, error: issues?.[0]?.message ?? "입력값이 올바르지 않습니다.", code: "VALIDATION", status: 400 };
  }
  console.error("[used-phones] unexpected error", err);
  return { ok: false, error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", status: 500 };
}
