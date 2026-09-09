import "server-only";
import { NextResponse } from "next/server";
import { AppError } from "./errors";

/** 라우트 핸들러 공용 에러 → JSON 변환 */
export async function handle<T>(fn: () => Promise<T>, okStatus = 200) {
  try {
    const data = await fn();
    return NextResponse.json({ ok: true, data }, { status: okStatus });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: err.code },
        { status: err.status },
      );
    }
    if (
      err &&
      typeof err === "object" &&
      (err as any).name === "OrderTransitionError"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: (err as Error).message,
          code: "INVALID_TRANSITION",
        },
        { status: 409 },
      );
    }
    if (err && typeof err === "object" && "issues" in err) {
      const issues = (err as any).issues as {
        path: (string | number)[];
        message: string;
      }[];
      return NextResponse.json(
        {
          ok: false,
          error: issues[0]?.message ?? "입력값이 올바르지 않습니다.",
          code: "VALIDATION",
          issues,
        },
        { status: 400 },
      );
    }
    console.error("[used-phones api]", err);
    return NextResponse.json(
      { ok: false, error: "처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function readJson<T = any>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError("JSON 본문이 필요합니다.");
  }
}

export function searchParamsToObject(url: string) {
  const sp = new URL(url).searchParams;
  const obj: Record<string, string> = {};
  sp.forEach((v, k) => {
    if (v !== "") obj[k] = v;
  });
  return obj;
}

/** 본문이 없거나 JSON 이 아니어도 빈 객체로 처리 */
export async function readJsonOptional<T extends object>(
  request: Request,
): Promise<Partial<T>> {
  try {
    const text = await request.text();
    if (!text.trim()) return {};
    return JSON.parse(text) as Partial<T>;
  } catch {
    return {};
  }
}
