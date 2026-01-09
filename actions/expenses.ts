"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "./user";
import {
  ExpenseWithSplits,
  GroupWithMembers,
  Prisma,
  Settlement,
  User,
} from "@/lib/prisma.types";
import {
  applySettlements,
  calculateExpense,
  filterExpensesBetweenUsers,
} from "@/helper";
import { CreateExpenseInput, SettlementWithNumberAmount } from "@/types";
import { Decimal } from "@prisma/client/runtime/client";

export const getExpensesBetweenUsers = async ({
  userId,
}: {
  userId: string;
}) => {
  const me = await getCurrentUser();
  if (me.id === userId) {
    throw new Error("Cannot query yourself");
  }

  const expenses: ExpenseWithSplits[] = await prisma.expense.findMany({
    where: {
      groupId: null,
      paidByUserId: { in: [me.id, userId] },
    },
    include: { splits: true },
    orderBy: { date: "desc" },
  });

  const filteredExpenses = filterExpensesBetweenUsers(
    expenses,
    me.id,
    userId
  ).map((expense) => ({
    ...expense,
    amount: Number(expense.amount),
    splits: expense.splits.map((split) => ({
      ...split,
      amount: Number(split.amount),
    })),
  }));

  const settlements: SettlementWithNumberAmount[] = (
    await prisma.settlement.findMany({
      where: {
        groupId: null,
        OR: [
          { paidByUserId: me.id, receivedByUserId: userId },
          { paidByUserId: userId, receivedByUserId: me.id },
        ],
      },
      orderBy: { date: "desc" },
    })
  ).map((settlement: Settlement) => ({
    ...settlement,
    amount: Number(settlement.amount),
  }));

  let balance = calculateExpense(filteredExpenses, me.id, userId);

  balance = applySettlements(balance, settlements, me.id);

  const otherUser: Pick<User, "id" | "name" | "email" | "image"> | null =
    await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

  if (!otherUser) {
    throw new Error("User not found");
  }

  return {
    expenses: filteredExpenses,
    settlements,
    otherUser,
    balance,
  };
};

export const deleteExpense = async ({ expenseId }: { expenseId: string }) => {
  const user = await getCurrentUser();

  const expense: ExpenseWithSplits | null = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { splits: true },
  });
  if (!expense) {
    throw new Error("Expense not found");
  }
  if (expense.createdById !== user.id && expense.paidByUserId !== user.id) {
    throw new Error("You don't have permission to delete this expense");
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const settlementLinks = await tx.settlementExpense.findMany({
      where: { expenseId },
      select: { settlementId: true },
    });

    const settlementIds = settlementLinks.map((link) => link.settlementId);

    await tx.settlementExpense.deleteMany({
      where: { expenseId },
    });

    for (const settlementId of settlementIds) {
      const remaining = await tx.settlementExpense.count({
        where: { settlementId },
      });

      if (remaining === 0) {
        await tx.settlement.delete({
          where: { id: settlementId },
        });
      }
    }

    await tx.expense.delete({
      where: { id: expenseId },
    });
  });

  return { success: true };
};

export const createExpense = async ({
  description,
  amount,
  category,
  date,
  paidByUserId,
  splitType,
  splits,
  groupId,
}: CreateExpenseInput): Promise<string> => {
  const user = await getCurrentUser();

  if (groupId) {
    const group: GroupWithMembers | null = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const isMember = group.members.some((member) => member.userId === user.id);

    if (!isMember) {
      throw new Error("You are not a member of this group");
    }
  }

  const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);

  const tolerance = 0.01;
  if (Math.abs(totalSplitAmount - amount) > tolerance) {
    throw new Error("Split amounts must add up to the total expense amount");
  }

  const newExpense = await prisma.expense.create({
    data: {
      description: description,
      amount: new Decimal(amount),
      category: category ?? "Other",
      date: new Date(date),
      paidByUserId: paidByUserId,
      splitType: splitType,
      groupId: groupId ?? null,
      createdById: user.id,
      splits: {
        create: splits.map((split) => ({
          userId: split.userId,
          amount: new Decimal(split.amount),
          paid: split.paid,
        })),
      },
    },
    select: { id: true },
  });

  return newExpense.id;
};
