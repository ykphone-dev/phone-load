"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { updateSellerProfileAction } from "../../actions/sellers";
import { BANKS } from "../../constants";
import { sellerProfileUpdateSchema, type SellerProfileUpdateInput } from "../../validations";

export function SellerProfileForm({ defaultValues }: { defaultValues: SellerProfileUpdateInput }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const form = useForm<SellerProfileUpdateInput>({
    resolver: zodResolver(sellerProfileUpdateSchema),
    defaultValues,
  });

  const onSubmit = (values: SellerProfileUpdateInput) => {
    const bankChanged =
      values.bankName !== defaultValues.bankName ||
      values.bankAccount !== defaultValues.bankAccount ||
      values.bankHolder !== defaultValues.bankHolder;
    if (bankChanged && !window.confirm("입금 계좌를 변경하시겠습니까? 변경 내역은 감사 로그에 기록됩니다.")) return;

    startTransition(async () => {
      const res = await updateSellerProfileAction(values);
      if (res.ok === false) {
        toast({ title: "저장 실패", description: res.error, variant: "destructive" });
        return;
      }
      toast({ title: "판매자 정보가 저장되었습니다" });
      form.reset(values);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)} className="space-y-6">
        <section className="space-y-3">
          <h3 className="font-semibold">담당자 / 연락처</h3>
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

        <section className="space-y-3">
          <h3 className="font-semibold">사업장 주소</h3>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주소</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold">입금 계좌</h3>
          <p className="text-xs text-zinc-500">
            소비자가 직접 입금하는 계좌입니다. 계좌 변경 내역은 감사 로그에 기록되며, 변경 후 생성되는 주문부터 적용됩니다.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>은행</FormLabel>
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
                      {field.value && !(BANKS as readonly string[]).includes(field.value) && (
                        <SelectItem value={field.value}>{field.value}</SelectItem>
                      )}
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
                    <Input inputMode="numeric" {...field} />
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

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={pending || !form.formState.isDirty}>
            {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>
        </div>
      </form>
    </Form>
  );
}
