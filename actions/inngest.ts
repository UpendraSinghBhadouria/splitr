"use server";

import {
  applyExpenseEffects,
  applySettlementEffects,
  extractDebts,
} from "@/helper";
import prisma from "@/lib/prisma";
import { ExpenseWithSplits, Settlement, UserLite } from "@/lib/prisma.types";
import { Ledger } from "@/types";

export const getUsersWithOutstandingDebts = async () => {
  const [users, expenses, settlements]: [
    UserLite[],
    ExpenseWithSplits[],
    Settlement[]
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
    }),
    prisma.expense.findMany({
      where: { groupId: null },
      include: { splits: true },
    }),
    prisma.settlement.findMany({
      where: { groupId: null },
    }),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));
  const result = [];

  for (const user of users) {
    const ledger: Ledger = new Map();

    applyExpenseEffects(ledger, user.id, expenses);
    applySettlementEffects(ledger, settlements, user.id);

    const debts = extractDebts(ledger, userMap);
    if (!debts.length) continue;

    result.push({
      id: user.id,
      name: user.name,
      email: user.email,
      debts,
    });
  }

  return result;
};

export const getUsersWithExpenses = async () => {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  // 1️ Load all recent expenses once
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: oneMonthAgo,
      },
    },
    include: {
      splits: {
        select: {
          userId: true,
        },
      },
    },
  });

  // 2️ Collect unique userIds involved
  const userIds = new Set<string>();

  for (const expense of expenses) {
    userIds.add(expense.paidByUserId);
    for (const split of expense.splits) {
      userIds.add(split.userId);
    }
  }

  if (userIds.size === 0) return [];

  // 3 Fetch users
  return prisma.user.findMany({
    where: {
      id: { in: Array.from(userIds) },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
};

export const getUserMonthlyExpenses = async (userId: string) => {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  const expenses: ExpenseWithSplits[] = await prisma.expense.findMany({
    where: {
      date: {
        gte: oneMonthAgo,
      },
      OR: [{ paidByUserId: userId }, { splits: { some: { userId } } }],
    },
    include: {
      splits: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return expenses.map((expense) => {
    const userSplit = expense.splits.find((split) => split.userId === userId);

    return {
      description: expense.description,
      category: expense.category,
      date: expense.date,
      amount: userSplit ? Number(userSplit.amount) : 0,
      isPayer: expense.paidByUserId === userId,
      isGroup: expense.groupId !== null,
    };
  });
};
