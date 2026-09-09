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
import { sellerShipAction } from "../../actions/seller-orders";
import { CARRIERS } from "../../constants";
import { shipmentSchema, type ShipmentInput } from "../../validations";

/** 송장 등록 → SHIPPED */
export function ShipmentForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const form = useForm<ShipmentInput>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: { carrier: undefined, trackingNumber: "", shippedAt: "" },
  });

  const onSubmit = (values: ShipmentInput) => {
    if (!window.confirm("송장을 등록하고 배송중으로 변경하시겠습니까?")) return;
    startTransition(async () => {
      const res = await sellerShipAction(orderId, values);
      if (res.ok === false) {
        toast({
          title: "송장 등록 실패",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "송장이 등록되었습니다",
        description: "주문이 배송중으로 변경되었습니다.",
      });
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
        className="space-y-3 border p-4"
      >
        <p className="text-sm font-medium">송장 등록</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="carrier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>택배사</FormLabel>
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="택배사 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CARRIERS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
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
            name="trackingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>송장번호</FormLabel>
                <FormControl>
                  <Input placeholder="숫자만 입력" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>배송일 (선택)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>
                  비우면 오늘 날짜로 기록됩니다.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            송장 등록 · 배송중으로 변경
          </Button>
        </div>
      </form>
    </Form>
  );
}
