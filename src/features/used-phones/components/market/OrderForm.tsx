"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { createOrderAction } from "../../actions/orders";
import { PLATFORM_NOTICE_NOT_PARTY } from "../../constants";
import { createOrderSchema, type CreateOrderInput } from "../../validations";

type Props = {
  productId: string;
  isLoggedIn: boolean;
  defaultName?: string;
};

/** 주문정보 입력 (기획서 12 STEP 3~5) */
export function OrderForm({ productId, isLoggedIn, defaultName }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      productId,
      buyerName: defaultName ?? "",
      buyerPhone: "",
      shippingPostalCode: "",
      shippingAddress: "",
      shippingAddressDetail: "",
      shippingMemo: "",
      password: "",
      agreeNotParty: undefined as unknown as true,
    },
  });

  const onSubmit = (values: CreateOrderInput) => {
    if (!isLoggedIn && !values.password) {
      form.setError("password", {
        message: "비회원 주문은 주문조회 비밀번호가 필요합니다",
      });
      return;
    }
    startTransition(async () => {
      const res = await createOrderAction(values);
      if (res.ok === false) {
        toast({
          title: "주문 실패",
          description: res.error,
          variant: "destructive",
        });
        if (res.status === 409) router.refresh();
        return;
      }
      toast({
        title: "주문이 생성되었습니다",
        description: `주문번호 ${res.data.orderNumber}`,
      });
      router.push(`/order/${res.data.orderNumber}/payment`);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="buyerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>구매자명</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="buyerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>휴대폰번호</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="010-0000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </FormControl>
              <FormDescription>
                주문조회와 배송 연락에 사용됩니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <FormField
            control={form.control}
            name="shippingPostalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>우편번호</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주소</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="street-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="shippingAddressDetail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세주소</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shippingMemo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>배송메모</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={2}
                  placeholder="부재 시 문 앞에 놓아주세요"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isLoggedIn && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주문조회 비밀번호</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormDescription>
                  비회원 주문입니다. 주문번호·휴대폰번호·이 비밀번호로 주문을
                  조회할 수 있습니다.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="agreeNotParty"
          render={({ field }) => (
            <FormItem className="rounded-sm border bg-zinc-50 p-3">
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(v) =>
                      field.onChange(v === true ? true : undefined)
                    }
                  />
                </FormControl>
                <div className="space-y-1 text-sm">
                  <FormLabel className="font-medium">
                    판매계약 당사자 고지에 동의합니다
                  </FormLabel>
                  <p className="text-xs text-zinc-600">
                    {PLATFORM_NOTICE_NOT_PARTY}
                  </p>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
          주문하기
        </Button>
      </form>
    </Form>
  );
}
