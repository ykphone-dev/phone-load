import { PLATFORM_NAME } from "../../constants";
import { formatKRW } from "../../utils";
import { CopyButton } from "../CopyButton";

type Props = {
  amount: number;
  seller: {
    businessName: string;
    bankName: string;
    bankAccount: string;
    bankHolder: string;
  };
};

/** 계좌이체 안내 (기획서 13). 주문 생성 이후에만 렌더링된다. */
export function BankTransferPanel({ amount, seller }: Props) {
  return (
    <div className="space-y-4">
      <div className="border bg-zinc-50 p-4 text-center">
        <p className="text-sm text-zinc-500">입금 금액</p>
        <p className="text-3xl font-bold">{formatKRW(amount)}</p>
      </div>
      <dl className="divide-y border-y text-sm">
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-zinc-500">판매자</dt>
          <dd className="font-medium">{seller.businessName}</dd>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-zinc-500">은행</dt>
          <dd className="font-medium">{seller.bankName}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 py-2.5">
          <dt className="text-zinc-500">계좌</dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono text-base font-semibold tracking-wide">
              {seller.bankAccount}
            </span>
            <CopyButton
              value={seller.bankAccount.replace(/-/g, "")}
              label="계좌번호 복사"
            />
          </dd>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-zinc-500">예금주</dt>
          <dd className="font-medium">{seller.bankHolder}</dd>
        </div>
      </dl>
      <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-600">
        <li className="font-medium text-rose-700">
          판매자 명의 계좌인지 확인하세요. 예금주가 다르면 입금하지 마세요.
        </li>
        <li>
          {PLATFORM_NAME}은 판매대금을 보관하지 않습니다. 대금은 판매자에게 직접
          전달됩니다.
        </li>
        <li>
          입금 후 아래 &quot;입금했습니다&quot; 버튼을 눌러주세요. 판매자가 실제
          입금을 확인한 뒤 배송이 시작됩니다.
        </li>
      </ul>
    </div>
  );
}
