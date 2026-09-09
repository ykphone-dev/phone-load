import "server-only";
import { env } from "@/env.mjs";
import { createClient } from "@supabase/supabase-js";

/**
 * 서비스 롤 키를 쓰는 서버 전용 Supabase 클라이언트.
 * Storage 업로드/서명 URL 발급 등 RLS 를 우회해야 하는 서버 작업에만 사용한다.
 * 절대 클라이언트 번들에 포함되면 안 된다 (server-only 로 보호).
 */
export function createAdminClient() {
  return createClient(
    `https://${env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.supabase.co`,
    env.DATABASE_SERVICE_ROLE,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
