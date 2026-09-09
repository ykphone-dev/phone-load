import "server-only";
import db from "@/lib/supabase/db";
import { platformSettings } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_RESERVATION_MINUTES, SETTING_KEYS } from "../constants";

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, key),
  });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(platformSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

/** 주문 후 입금완료 표시가 없을 때 자동취소까지의 시간(분). 관리자 설정 가능. */
export async function getReservationMinutes(): Promise<number> {
  const raw = await getSetting(SETTING_KEYS.RESERVATION_MINUTES);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RESERVATION_MINUTES;
}
