"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { lookupOrderAction } from "../../actions/orders";
import { orderLookupSchema, type OrderLookupInput } from "../../validations";

export function OrderLookupForm({
  defaultOrderNumber = "",
}: {
  defaultOrderNumber?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const form = useForm<OrderLookupInput>({
    resolver: zodResolver(orderLookupSchema),
    defaultValues: {
      orderNumber: defaultOrderNumber,
      buyerPhone: "",
      password: "",
    },
  });

  const onSubmit = (values: OrderLookupInput) => {
    startTransition(async () => {
      const res = await lookupOrderAction(values);
      if (res.ok === false) {
        toast({
          title: "조회 실패",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      router.push(`/order/${res.data.orderNumber}`);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="orderNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주문번호</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="ORDER-20260909-000123"
                  className="font-mono"
                />
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
                <Input {...field} placeholder="010-0000-0000" inputMode="tel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주문조회 비밀번호</FormLabel>
              <FormControl>
                <Input {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
          주문 조회
        </Button>
      </form>
    </Form>
  );
}
