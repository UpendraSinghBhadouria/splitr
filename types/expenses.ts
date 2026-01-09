import { EXPENSE_CATEGORIES } from "@/helper/expenses";
import { ExpenseWithSplits, Settlement } from "@/lib/prisma.types";

export type CategoryId = keyof typeof EXPENSE_CATEGORIES;

export type PaymentDisplay = {
  title: string;
  label: string;
  labelClassName: string;
};

export type BalanceStatus = {
  label: React.ReactNode;
  amountClassName: string;
};

type Replace<T, R> = Omit<T, keyof R> & R;

export type SplitWithNumberAmount = Replace<
  ExpenseWithSplits["splits"][number],
  { amount: number }
>;

export type ExpenseWithSplitsNumber = Replace<
  ExpenseWithSplits,
  {
    amount: number;
    splits: SplitWithNumberAmount[];
  }
>;

export type SettlementWithNumberAmount = Replace<
  Settlement,
  { amount: number }
>;

export type CreateExpenseInput = {
  description: string;
  amount: number;
  category?: string;
  date: number; // timestamp
  paidByUserId: string;
  splitType: "equal" | "percentage" | "exact";
  splits: {
    userId: string;
    amount: number;
    paid: boolean;
  }[];
  groupId?: string;
};

export type SplitUIState = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  amount: number;
  percentage: number;
  paid: boolean;
};
