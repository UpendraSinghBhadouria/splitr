"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { GetSettlementData } from "@/types";
import { useServerAction, useUserSessionContext } from "@/hooks";
import { createSettlement } from "@/actions";
import { NetBalanceRow } from "./NetBalanceRow";

// Form schema validation
const settlementSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  note: z.string().optional(),
  paymentType: z.enum(["youPaid", "theyPaid"]),
});

interface SettlementFormProperties {
  entityType: "user" | "group";
  entityData: GetSettlementData;
  onSuccess: () => void;
}

export const SettlementForm = ({
  entityType,
  entityData,
  onSuccess,
}: SettlementFormProperties) => {
  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState("");

  const { user: currentUser } = useUserSessionContext();
  const { create } = useServerAction(createSettlement, {
    method: "POST",
    auto: false,
  });

  // Set up form with validation
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof settlementSchema>>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: "",
      note: "",
      paymentType: "youPaid",
    },
  });

  // Get selected payment direction
  const paymentType = watch("paymentType");

  // Single user settlement
  const handleUserSettlement = async (
    data: z.infer<typeof settlementSchema>
  ) => {
    const amount = parseFloat(data.amount);

    try {
      // Determine payer and receiver based on the selected payment type
      const paidByUserId =
        data.paymentType === "youPaid"
          ? currentUser.id
          : entityData?.counterpart?.userId;

      const receivedByUserId =
        data.paymentType === "youPaid"
          ? entityData?.counterpart?.userId
          : currentUser.id;

      await create?.({
        amount,
        note: data.note,
        paidByUserId: paidByUserId as string,
        receivedByUserId: receivedByUserId as string,
        // No groupId for user settlements
      });

      toast.success("Settlement recorded successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(`Failed to record settlement: ${(error as Error).message}`);
    }
  };

  // Group settlement
  const handleGroupSettlement = async (
    data: z.infer<typeof settlementSchema>,
    selectedUserId: string
  ) => {
    if (!selectedUserId) {
      toast.error("Please select a group member to settle with");
      return;
    }

    const amount = parseFloat(data.amount);

    try {
      // Get the selected user from the group balances
      const selectedUser = entityData.balances?.find(
        (balance) => balance.userId === selectedUserId
      );

      if (!selectedUser) {
        toast.error("Selected user not found in group");
        return;
      }

      // Determine payer and receiver based on the selected payment type and balances
      const paidByUserId =
        data.paymentType === "youPaid" ? currentUser.id : selectedUser.userId;

      const receivedByUserId =
        data.paymentType === "youPaid" ? selectedUser.userId : currentUser.id;

      await create?.({
        amount,
        note: data.note,
        paidByUserId,
        receivedByUserId,
        groupId: entityData.group?.id,
      });

      toast.success("Settlement recorded successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(`Failed to record settlement: ${(error as Error).message}`);
    }
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof settlementSchema>) => {
    if (entityType === "user") {
      await handleUserSettlement(data);
    } else if (entityType === "group" && selectedGroupMemberId) {
      await handleGroupSettlement(data, selectedGroupMemberId);
    }
  };

  if (!currentUser) return null;

  // Render the form for individual settlement
  if (entityType === "user") {
    const otherUser = entityData.counterpart;
    const netBalance = entityData.netBalance;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Balance information */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Current balance</h3>
          <NetBalanceRow
            netBalance={netBalance as number}
            otherUserName={otherUser?.name}
          />
        </div>

        {/* Payment direction */}
        <div className="space-y-2">
          <Label>Who paid?</Label>
          <RadioGroup
            defaultValue="youPaid"
            {...register("paymentType")}
            className="flex flex-col space-y-2"
            onValueChange={(value) => {
              // This manual approach is needed because RadioGroup doesn't work directly with react-hook-form
              register("paymentType").onChange({
                target: { name: "paymentType", value },
              });
            }}
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="youPaid" id="youPaid" />
              <Label htmlFor="youPaid" className="grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={currentUser.image ?? ""} />
                    <AvatarFallback>
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>You paid {otherUser?.name}</span>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="theyPaid" id="theyPaid" />
              <Label htmlFor="theyPaid" className="grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={otherUser?.image ?? ""} />
                    <AvatarFallback>{otherUser?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{otherUser?.name} paid you</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5">$</span>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              className="pl-7"
              {...register("amount")}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            placeholder="Dinner, rent, etc."
            {...register("note")}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Recording..." : "Record settlement"}
        </Button>
      </form>
    );
  }

  // Render form for group settlement
  if (entityType === "group") {
    const groupMembers = entityData.balances;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Select group member */}
        <div className="space-y-2">
          <Label>Who are you settling with?</Label>
          <div className="space-y-2">
            {groupMembers?.map((member) => {
              const isSelected = selectedGroupMemberId === member.userId;

              return (
                <div
                  key={member.userId}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedGroupMemberId(member.userId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member?.image ?? ""} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <NetBalanceRow
                      netBalance={member.netBalance}
                      variant="compact"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {!selectedGroupMemberId && (
            <p className="text-sm text-amber-600">
              Please select a member to settle with
            </p>
          )}
        </div>

        {selectedGroupMemberId && (
          <>
            {/* Payment direction */}
            <div className="space-y-2">
              <Label>Who paid?</Label>
              <RadioGroup
                defaultValue="youPaid"
                {...register("paymentType")}
                className="flex flex-col space-y-2"
                onValueChange={(value) => {
                  register("paymentType").onChange({
                    target: { name: "paymentType", value },
                  });
                }}
              >
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="youPaid" id="youPaid" />
                  <Label htmlFor="youPaid" className="grow cursor-pointer">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={currentUser.image ?? ""} />
                        <AvatarFallback>
                          {currentUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        You paid{" "}
                        {
                          groupMembers?.find(
                            (m) => m.userId === selectedGroupMemberId
                          )?.name
                        }
                      </span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="theyPaid" id="theyPaid" />
                  <Label htmlFor="theyPaid" className="grow cursor-pointer">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage
                          src={
                            groupMembers?.find(
                              (m) => m.userId === selectedGroupMemberId
                            )?.image ?? ""
                          }
                        />
                        <AvatarFallback>
                          {groupMembers
                            ?.find((m) => m.userId === selectedGroupMemberId)
                            ?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {
                          groupMembers?.find(
                            (m) => m.userId === selectedGroupMemberId
                          )?.name
                        }{" "}
                        paid you
                      </span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-7"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Dinner, rent, etc."
                {...register("note")}
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !selectedGroupMemberId}
        >
          {isSubmitting ? "Recording..." : "Record settlement"}
        </Button>
      </form>
    );
  }

  return null;
};
