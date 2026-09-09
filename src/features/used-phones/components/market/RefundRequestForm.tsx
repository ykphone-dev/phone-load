"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { requestRefundAction } from "../../actions/orders";
import { BANKS, REFUND_REASONS, REFUND_REASON_LABEL } from "../../constants";
import {
  refundRequestSchema,
  type RefundRequestInput,
} from "../../validations";
import { ImageUploader } from "../ImageUploader";

const selectClass = "flex h-10 w-full border bg-white px-3 text-sm";

/** 환불 요청 (기획서 21). 판매자가 소비자 계좌로 직접 환불하므로 환불 계좌를 받는다. */
export function RefundRequestForm({
  orderNumber,
  buyerName,
}: {
  orderNumber: string;
  buyerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RefundRequestInput>({
    resolver: zodResolver(refundRequestSchema),
    defaultValues: {
      reason: "NOT_AS_DESCRIBED",
      description: "",
      imageUrls: [],
      refundBankName: "",
      refundAccount: "",
      refundHolder: buyerName,
    },
  });

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        환불 요청
      </Button>
    );
  }

  const onSubmit = (values: RefundRequestInput) => {
    if (
      !window.confirm(
        "환불을 요청하시겠습니까? 판매자가 확인 후 환불 계좌로 송금합니다.",
      )
    )
      return;
    startTransition(async () => {
      const res = await requestRefundAction(orderNumber, values);
      if (res.ok === false) {
        toast({
          title: "요청 실패",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({ title: "환불을 요청했습니다" });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 border p-4"
      >
        <h3 className="font-semibold">환불 요청</h3>
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>사유</FormLabel>
              <FormControl>
                <select
                  className={selectClass}
                  value={field.value}
                  onChange={field.onChange}
                >
                  {REFUND_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {REFUND_REASON_LABEL[r]}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세 내용</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="어떤 문제가 있는지 구체적으로 적어주세요"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>사진 첨부</FormLabel>
              <FormControl>
                <ImageUploader
                  scope="evidence"
                  orderNumber={orderNumber}
                  value={field.value}
                  onChange={field.onChange}
                  max={10}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="refundBankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>환불 은행</FormLabel>
                <FormControl>
                  <select
                    className={selectClass}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="">선택</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="refundAccount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>환불 계좌번호</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="numeric" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="refundHolder"
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
        <FormDescription>
          환불은 판매자가 위 계좌로 직접 송금합니다. 환불금을 받으면
          &quot;환불금 확인&quot; 버튼을 눌러주세요.
        </FormDescription>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
            환불 요청하기
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
        </div>
      </form>
    </Form>
  );
}
