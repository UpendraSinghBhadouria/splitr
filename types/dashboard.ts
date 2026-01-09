import { GroupWithMembers } from "@/lib/prisma.types";

export type Balance = {
  owed: number;
  owing: number;
};

export type BalanceMap = Record<string, Balance>;

export type BalanceItem = {
  userId: string;
  name: string;
  image: string | null;
  amount: number;
};

export type UserMap = Record<
  string,
  {
    name: string | null;
    image: string | null;
  }
>;

export type MonthlySpendingItem = {
  month: number; // timestamp (start of month)
  total: number;
};

export type GroupWithBalance = GroupWithMembers & {
  balance: number;
};
