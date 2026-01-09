import { getSettlementData } from "@/actions";

export type CreateSettlementInput = {
  amount: number;
  note?: string;
  paidByUserId: string;
  receivedByUserId: string;
  groupId?: string;
};

export type SettlementDataInput = {
  entityType: "user" | "group";
  entityId: string;
};

export type GetSettlementData = Awaited<ReturnType<typeof getSettlementData>>;
