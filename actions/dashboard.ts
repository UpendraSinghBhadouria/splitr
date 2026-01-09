"use server";

import {
  BalanceMap,
  ExpenseWithSplitsNumber,
  GroupWithBalance,
  MonthlySpendingItem,
  SettlementWithNumberAmount,
  UserLite,
  UserMap,
} from "@/types";
import prisma from "../lib/prisma";
import { getCurrentUser } from "./user";
import {
  applySettlements,
  buildLists,
  calculateExpenseBalance,
  processExpenses,
  processSettlements,
} from "@/helper";
import { ExpenseWithSplits, GroupWithMembers } from "@/lib/prisma.types";

export const getUserBalances = async () => {
  const user = await getCurrentUser();

  const expenses = await prisma.expense.findMany({
    where: {
      groupId: null,
      OR: [
        { paidByUserId: user.id },
        { splits: { some: { userId: user.id } } },
      ],
    },
    include: { splits: true },
  });

  const balanceByUser: BalanceMap = {};

  const { youOwe, youAreOwed } = processExpenses(
    expenses,
    user.id,
    balanceByUser
  );

  const settlements = await prisma.settlement.findMany({
    where: {
      groupId: null,
      OR: [{ paidByUserId: user.id }, { receivedByUserId: user.id }],
    },
  });

  const { youAreOwedDelta, youOweDelta } = processSettlements(
    settlements,
    user.id,
    balanceByUser
  );

  const userIds = Object.keys(balanceByUser);

  const users: UserLite[] = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
    },
  });

  const userMap: UserMap = Object.fromEntries(
    users.map((user) => [user.id, { name: user.name, image: user.image }])
  );

  const lists = buildLists(balanceByUser, userMap);

  return {
    youOwe: youOwe + youOweDelta,
    youAreOwed: youAreOwed + youAreOwedDelta,
    totalBalance: youAreOwed + youAreOwedDelta - (youOwe + youOweDelta),
    oweDetails: lists,
  };
};

export const getTotalSpent = async (): Promise<number> => {
  const user = await getCurrentUser();

  // Start of current year (Jan 1, 00:00)
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  // Fetch expenses from current year where user is involved
  const expenses: ExpenseWithSplits[] = await prisma.expense.findMany({
    where: {
      date: {
        gte: startOfYear,
      },
      OR: [
        { paidByUserId: user.id },
        { splits: { some: { userId: user.id } } },
      ],
    },
    include: {
      splits: true,
    },
  });

  // Calculate total spent (user's personal share only)
  let totalSpent = 0;

  for (const expense of expenses) {
    const userSplit = expense.splits.find((split) => split.userId === user.id);

    if (userSplit) {
      totalSpent += userSplit.amount.toNumber();
    }
  }

  return totalSpent;
};

export const getMonthlySpending = async (): Promise<MonthlySpendingItem[]> => {
  const user = await getCurrentUser();

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  //  Fetch expenses for current year where user is involved
  const expenses: ExpenseWithSplits[] = await prisma.expense.findMany({
    where: {
      date: { gte: startOfYear },
      OR: [
        { paidByUserId: user.id },
        { splits: { some: { userId: user.id } } },
      ],
    },
    include: {
      splits: true,
    },
  });

  //    Initialize all months with zero
  const monthlyTotals: Record<number, number> = {};

  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(currentYear, month, 1).getTime();
    monthlyTotals[monthStart] = 0;
  }

  //    Sum user's share per month
  for (const expense of expenses) {
    const userSplit = expense.splits.find((split) => split.userId === user.id);

    if (!userSplit) continue;

    const expenseDate = new Date(expense.date);
    const monthStart = new Date(
      expenseDate.getFullYear(),
      expenseDate.getMonth(),
      1
    ).getTime();

    monthlyTotals[monthStart] += userSplit.amount.toNumber();
  }

  return Object.entries(monthlyTotals)
    .map(([month, total]) => ({
      month: Number(month),
      total,
    }))
    .sort((a, b) => a.month - b.month);
};

export const getUserGroups = async (): Promise<GroupWithBalance[]> => {
  const user = await getCurrentUser();

  //  Fetch groups where user is a member
  const groups: GroupWithMembers[] = await prisma.group.findMany({
    where: {
      members: {
        some: { userId: user.id },
      },
    },
    include: { members: true },
  });

  if (!groups.length) return [];

  const groupIds = groups.map((group) => group.id);

  // Fetch expenses for all groups (1 query)
  const expenses = await prisma.expense.findMany({
    where: {
      groupId: { in: groupIds },
    },
    include: {
      splits: true,
    },
  });

  //  Fetch settlements for all groups (1 query)
  const settlements = await prisma.settlement.findMany({
    where: {
      groupId: { in: groupIds },
      OR: [{ paidByUserId: user.id }, { receivedByUserId: user.id }],
    },
  });

  // Group data by groupId
  const expensesByGroup: Record<string, ExpenseWithSplitsNumber[]> = {};
  const settlementsByGroup: Record<string, SettlementWithNumberAmount[]> = {};

  for (const expense of expenses) {
    if (!expensesByGroup[expense.groupId!]) {
      expensesByGroup[expense.groupId!] = [];
    }
    expensesByGroup[expense.groupId!].push({
      ...expense,
      amount: Number(expense.amount),
      splits: expense.splits.map((split) => ({
        ...split,
        amount: Number(split.amount),
      })),
    });
  }

  for (const settlement of settlements) {
    if (!settlementsByGroup[settlement.groupId!]) {
      settlementsByGroup[settlement.groupId!] = [];
    }
    settlementsByGroup[settlement.groupId!].push({
      ...settlement,
      amount: Number(settlement.amount),
    });
  }

  // Calculate balances
  return groups.map((group) => {
    const expenseBalance = calculateExpenseBalance(
      expensesByGroup[group.id] ?? [],
      user.id
    );

    const finalBalance = applySettlements(
      expenseBalance,
      settlementsByGroup[group.id] ?? [],
      user.id
    );

    return {
      ...group,
      balance: finalBalance,
    };
  });
};
