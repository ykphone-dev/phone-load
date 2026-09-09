import AdminShell from "@/components/admin/AdminShell";
import { KeyValueList, SectionTitle } from "@/features/used-phones/components";
import { SettingsForm } from "@/features/used-phones/components/admin";
import { DEFAULT_RESERVATION_MINUTES, SETTING_KEYS } from "@/features/used-phones/constants";
import { requireAdmin } from "@/features/used-phones/server/auth";
import { AppError } from "@/features/used-phones/server/errors";
import { getReservationMinutes } from "@/features/used-phones/server/settings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AppError && (err.status === 401 || err.status === 403)) redirect("/sign-in");
    throw err;
  }
  const minutes = await getReservationMinutes();

  return (
    <AdminShell heading="플랫폼 설정" description="중고폰 마켓플레이스 운영 설정값을 관리합니다.">
      <section className="mb-8">
        <SectionTitle>미입금 자동취소</SectionTitle>
        <SettingsForm initialMinutes={minutes} />
      </section>

      <section className="max-w-md">
        <SectionTitle>현재 설정값</SectionTitle>
        <KeyValueList
          items={[
            { label: "설정 키", value: <span className="font-mono text-xs">{SETTING_KEYS.RESERVATION_MINUTES}</span> },
            { label: "적용 값", value: `${minutes}분` },
            { label: "기본값", value: `${DEFAULT_RESERVATION_MINUTES}분 (설정이 없을 때)` },
          ]}
        />
        <p className="mt-2 text-xs text-zinc-500">변경된 값은 이후 생성되는 주문부터 적용됩니다.</p>
      </section>
    </AdminShell>
  );
}
