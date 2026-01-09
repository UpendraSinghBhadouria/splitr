import {
  CategoryId,
  PaymentDisplay,
  SettlementWithNumberAmount,
} from "@/types";
import {
  Coffee,
  ShoppingBag,
  Utensils,
  Plane,
  Car,
  Home,
  Film,
  ShoppingCart,
  Ticket,
  Wifi,
  Droplets,
  GraduationCap,
  Heart,
  Stethoscope,
  Gift,
  Smartphone,
  MoreHorizontal,
  CreditCard,
  Baby,
  Music,
  Book,
  DollarSign,
} from "lucide-react";
import { ExpenseWithSplits } from "@/lib/prisma.types";
import { ExpenseWithSplitsNumber } from "../types";

// Object containing all categories with their respective icons
export const EXPENSE_CATEGORIES = {
  foodDrink: {
    id: "foodDrink",
    name: "Food & Drink",
    icon: Utensils,
  },
  coffee: {
    id: "coffee",
    name: "Coffee",
    icon: Coffee,
  },
  groceries: {
    id: "groceries",
    name: "Groceries",
    icon: ShoppingCart,
  },
  shopping: {
    id: "shopping",
    name: "Shopping",
    icon: ShoppingBag,
  },
  travel: {
    id: "travel",
    name: "Travel",
    icon: Plane,
  },
  transportation: {
    id: "transportation",
    name: "Transportation",
    icon: Car,
  },
  housing: {
    id: "housing",
    name: "Housing",
    icon: Home,
  },
  entertainment: {
    id: "entertainment",
    name: "Entertainment",
    icon: Film,
  },
  tickets: {
    id: "tickets",
    name: "Tickets",
    icon: Ticket,
  },
  utilities: {
    id: "utilities",
    name: "Utilities",
    icon: Wifi,
  },
  water: {
    id: "water",
    name: "Water",
    icon: Droplets,
  },
  education: {
    id: "education",
    name: "Education",
    icon: GraduationCap,
  },
  health: {
    id: "health",
    name: "Health",
    icon: Stethoscope,
  },
  personal: {
    id: "personal",
    name: "Personal",
    icon: Heart,
  },
  gifts: {
    id: "gifts",
    name: "Gifts",
    icon: Gift,
  },
  technology: {
    id: "technology",
    name: "Technology",
    icon: Smartphone,
  },
  bills: {
    id: "bills",
    name: "Bills & Fees",
    icon: CreditCard,
  },
  baby: {
    id: "baby",
    name: "Baby & Kids",
    icon: Baby,
  },
  music: {
    id: "music",
    name: "Music",
    icon: Music,
  },
  books: {
    id: "books",
    name: "Books",
    icon: Book,
  },
  other: {
    id: "other",
    name: "Other",
    icon: MoreHorizontal,
  },
  general: {
    id: "general",
    name: "General Expense",
    icon: DollarSign,
  },
};

// Helper function to get category by ID
export const getCategoryById = (categoryId: CategoryId) => {
  return EXPENSE_CATEGORIES[categoryId] || EXPENSE_CATEGORIES.other;
};

// Get array of all categories (useful for dropdowns)
export const getAllCategories = () => {
  return Object.values(EXPENSE_CATEGORIES);
};

// Get icon for a category
export const getCategoryIcon = (categoryId: CategoryId) => {
  const category = getCategoryById(categoryId);
  return category.icon;
};

export const getPaymentDisplay = (
  isPayer: boolean,
  isReceiver: boolean,
  payerName: string,
  receiverName: string
): PaymentDisplay => {
  if (isPayer) {
    return {
      title: `You paid ${receiverName}`,
      label: "You paid",
      labelClassName: "text-amber-600",
    };
  }

  if (isReceiver) {
    return {
      title: `${payerName} paid you`,
      label: "You received",
      labelClassName: "text-green-600",
    };
  }

  return {
    title: `${payerName} paid ${receiverName}`,
    label: "Payment",
    labelClassName: "",
  };
};

//  Keep only expenses where both users are involved
export const filterExpensesBetweenUsers = (
  expenses: ExpenseWithSplits[],
  meId: string,
  otherUserId: string
): ExpenseWithSplits[] => {
  return expenses.filter((e) => {
    const meInvolved =
      e.paidByUserId === meId || e.splits.some((s) => s.userId === meId);

    const otherInvolved =
      e.paidByUserId === otherUserId ||
      e.splits.some((s) => s.userId === otherUserId);

    return meInvolved && otherInvolved;
  });
};

// Compute balance from expenses
export const calculateExpense = (
  expenses: ExpenseWithSplitsNumber[],
  meId: string,
  otherUserId: string
): number => {
  let balance = 0;

  for (const e of expenses) {
    const split =
      e.paidByUserId === meId
        ? e.splits.find((s) => s.userId === otherUserId && !s.paid)
        : e.splits.find((s) => s.userId === meId && !s.paid);

    if (!split) continue;

    balance += e.paidByUserId === meId ? split.amount : -split.amount;
  }

  return balance;
};

// Group helper functions
type Ledger = Record<string, Record<string, number>>;

export const initializeLedger = (
  memberIds: string[]
): { totals: Record<string, number>; ledger: Ledger } => {
  const totals: Record<string, number> = {};
  const ledger: Ledger = {};

  memberIds.forEach((id) => {
    totals[id] = 0;
    ledger[id] = {};
    memberIds.forEach((other) => {
      if (id !== other) ledger[id][other] = 0;
    });
  });

  return { totals, ledger };
};

export const applyExpensesToLedger = (
  expenses: ExpenseWithSplitsNumber[],
  totals: Record<string, number>,
  ledger: Ledger
): void => {
  for (const expense of expenses) {
    const payer = expense.paidByUserId;

    for (const split of expense.splits) {
      if (split.userId === payer || split.paid) continue;

      const amount = split.amount;
      const debtor = split.userId;

      totals[payer] += amount;
      totals[debtor] -= amount;

      ledger[debtor][payer] += amount;
    }
  }
};

export const applySettlementsToLedger = (
  settlements: SettlementWithNumberAmount[],
  totals: Record<string, number>,
  ledger: Ledger
): void => {
  for (const settlement of settlements) {
    const amount = settlement.amount;

    totals[settlement.paidByUserId] += amount;
    totals[settlement.receivedByUserId] -= amount;

    ledger[settlement.paidByUserId][settlement.receivedByUserId] -= amount;
  }
};

export const netLedger = (memberIds: string[], ledger: Ledger): void => {
  for (const a of memberIds) {
    for (const b of memberIds) {
      if (a >= b) continue;

      const diff = ledger[a][b] - ledger[b][a];
      if (diff > 0) {
        ledger[a][b] = diff;
        ledger[b][a] = 0;
      } else if (diff < 0) {
        ledger[b][a] = -diff;
        ledger[a][b] = 0;
      } else {
        ledger[a][b] = 0;
        ledger[b][a] = 0;
      }
    }
  }
};
