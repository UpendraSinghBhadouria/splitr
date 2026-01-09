import { ExpenseWithSplits, Settlement } from "@/lib/prisma.types";
import { Balance, BalanceItem, BalanceMap, ExpenseWithSplitsNumber, UserMap } from "../types";
import { SettlementWithNumberAmount } from "@/types";

export const ensureBalance = (map: BalanceMap, userId: string): Balance => {
  map[userId] ??= { owed: 0, owing: 0 };
  return map[userId];
};

export const processExpenses = (
  expenses: ExpenseWithSplits[],
  userId: string,
  balanceByUser: BalanceMap
) => {
  let youOwe = 0;
  let youAreOwed = 0;

  for (const e of expenses) {
    if (e.paidByUserId === userId) {
      for (const s of e.splits) {
        if (s.userId === userId || s.paid) continue;

        youAreOwed += s.amount.toNumber();
        ensureBalance(balanceByUser, s.userId).owed += s.amount.toNumber();
      }
      continue;
    }

    const mySplit = e.splits.find((s) => s.userId === userId && !s.paid);

    if (!mySplit) continue;

    youOwe += mySplit.amount.toNumber();
    ensureBalance(balanceByUser, e.paidByUserId).owing +=
      mySplit.amount.toNumber();
  }

  return { youOwe, youAreOwed };
};

export const processSettlements = (
  settlements: Settlement[],
  userId: string,
  balanceByUser: BalanceMap
) => {
  let youOweDelta = 0;
  let youAreOwedDelta = 0;

  for (const s of settlements) {
    if (s.paidByUserId === userId) {
      youOweDelta -= Number(s.amount);
      ensureBalance(balanceByUser, s.receivedByUserId).owing -= Number(
        s.amount
      );
    } else {
      youAreOwedDelta -= Number(s.amount);
      ensureBalance(balanceByUser, s.paidByUserId).owed -= Number(s.amount);
    }
  }

  return { youOweDelta, youAreOwedDelta };
};

export const buildLists = (balanceByUser: BalanceMap, userMap: UserMap) => {
  const youOwe: BalanceItem[] = [];
  const youAreOwedBy: BalanceItem[] = [];

  for (const [userId, { owed, owing }] of Object.entries(balanceByUser)) {
    const net = owed - owing;
    if (!net) continue;

    const user = userMap[userId];

    const item: BalanceItem = {
      userId,
      name: user?.name ?? "Unknown",
      image: user?.image ?? null,
      amount: Math.abs(net),
    };

    if (net > 0) {
      youAreOwedBy.push(item);
    } else {
      youOwe.push(item);
    }
  }

  youOwe.sort((a, b) => b.amount - a.amount);
  youAreOwedBy.sort((a, b) => b.amount - a.amount);

  return { youOwe, youAreOwedBy };
};

export const calculateExpenseBalance = (
  expenses: ExpenseWithSplitsNumber[],
  userId: string
): number => {
  let balance = 0;

  for (const expense of expenses) {
    if (expense.paidByUserId === userId) {
      for (const split of expense.splits) {
        if (split.userId !== userId && !split.paid) {
          balance += split.amount;
        }
      }
    } else {
      const userSplit = expense.splits.find(
        (s) => s.userId === userId && !s.paid
      );
      if (userSplit) {
        balance -= userSplit.amount;
      }
    }
  }

  return balance;
};

export const applySettlements = (
  balance: number,
  settlements: SettlementWithNumberAmount[],
  userId: string
): number => {
  for (const settlement of settlements) {
    balance +=
      settlement.paidByUserId === userId
        ? settlement.amount
        : -settlement.amount;
  }
  return balance;
};
