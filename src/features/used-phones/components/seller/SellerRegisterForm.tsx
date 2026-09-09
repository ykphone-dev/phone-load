"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { registerSellerAction } from "../../actions/sellers";
import { BANKS, PLATFORM_NAME } from "../../constants";
import { sellerRegisterSchema, type SellerRegisterInput } from "../../validations";
import { ImageUploader } from "../ImageUploader";

type Props = {
  /** 반려 후 재신청 시 기존 값 */
  defaultValues?: Partial<SellerRegisterInput>;
};

const EMPTY: SellerRegisterInput = {
  businessName: "",
  representativeName: "",
  businessNumber: "",
  mailOrderNumber: "",
  address: "",
  addressDetail: "",
  contactName: "",
  contactPhone: "",
  bankName: "",
  bankAccount: "",
  bankHolder: "",
  businessLicenseUrl: "",
  mailOrderLicenseUrl: "",
};

export function SellerRegisterForm({ defaultValues }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const form = useForm<SellerRegisterInput>({
    resolver: zodResolver(sellerRegisterSchema),
    defaultValues: { ...EMPTY, ...(defaultValues ?? {}) },
  });

  const onSubmit = (values: SellerRegisterInput) => {
    startTransition(async () => {
      const res = await registerSellerAction(values);
      if (res.ok === false) {
        toast({ title: "입점 신청 실패", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "입점 신청이 접수되었습니다", description: "관리자 승인 후 판매를 시작할 수 있습니다." });
      router.push("/seller/pending");
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="font-semibold">사업자 정보</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상호</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 옆커모바일" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="representativeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>대표자명</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사업자등록번호</FormLabel>
                  <FormControl>
                    <Input placeholder="000-00-00000" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mailOrderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>통신판매업 신고번호</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 2024-서울강남-01234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사업장 주소</FormLabel>
                <FormControl>
                  <Input placeholder="도로명 주소" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressDetail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상세주소</FormLabel>
                <FormControl>
                  <Input placeholder="동/호수 등 (선택)" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold">담당자</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당자 이름</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당자 휴대폰</FormLabel>
                  <FormControl>
                    <Input placeholder="010-0000-0000" inputMode="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold">입금 계좌</h3>
          <div className="rounded-md border bg-zinc-50 p-3 text-sm text-zinc-600">
            판매대금은 소비자가 이 계좌로 <b>직접 입금</b>합니다. {PLATFORM_NAME}은 통신판매중개 플랫폼으로서
            판매대금을 보관하거나 정산하지 않습니다. 계좌 정보는 주문 후 구매자에게 공개됩니다.
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>입금 은행</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="은행 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BANKS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>계좌번호</FormLabel>
                  <FormControl>
                    <Input placeholder="숫자와 하이픈만" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>예금주</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-semibold">서류 업로드</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="businessLicenseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사업자등록증</FormLabel>
                  <FormControl>
                    <ImageUploader
                      scope="seller-doc"
                      max={1}
                      accept="image/*,application/pdf"
                      preview={false}
                      label="사업자등록증 업로드"
                      value={field.value ? [field.value] : []}
                      onChange={(urls) => field.onChange(urls[0] ?? "")}
                    />
                  </FormControl>
                  <FormDescription>이미지 또는 PDF. 관리자 검토용으로만 사용되며 외부에 공개되지 않습니다.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mailOrderLicenseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>통신판매업 신고증</FormLabel>
                  <FormControl>
                    <ImageUploader
                      scope="seller-doc"
                      max={1}
                      accept="image/*,application/pdf"
                      preview={false}
                      label="통신판매업 신고증 업로드"
                      value={field.value ? [field.value] : []}
                      onChange={(urls) => field.onChange(urls[0] ?? "")}
                    />
                  </FormControl>
                  <FormDescription>이미지 또는 PDF.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="flex justify-end gap-2 border-t pt-6">
          <Button type="submit" disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            입점 신청
          </Button>
        </div>
      </form>
    </Form>
  );
}
