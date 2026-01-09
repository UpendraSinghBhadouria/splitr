"use server";

import prisma from "@/lib/prisma";
import {
  ExpenseWithSplits,
  GroupWithMembers,
  Settlement,
  User,
} from "@/lib/prisma.types";
import { getCurrentUser } from "./user";
import {
  applyExpensesToLedger,
  applySettlementsToLedger,
  initializeLedger,
  netLedger,
} from "@/helper";
import { ExpenseWithSplitsNumber, SettlementWithNumberAmount } from "@/types";

export const getGroupExpenses = async ({ groupId }: { groupId: string }) => {
  const currentUser = await getCurrentUser();

  // group & access
  const group: GroupWithMembers | null = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) throw new Error("Group not found");

  if (!group.members.some((m) => m.userId === currentUser.id)) {
    throw new Error("You are not a member of this group");
  }

  //  data
  const expenses: ExpenseWithSplitsNumber[] = (
    await prisma.expense.findMany({
      where: { groupId },
      include: { splits: true },
      orderBy: { date: "desc" },
    })
  ).map((expense: ExpenseWithSplits) => ({
    ...expense,
    amount: Number(expense.amount),
    splits: expense.splits.map((split) => ({
      ...split,
      amount: Number(split.amount),
    })),
  }));

  const settlements: SettlementWithNumberAmount[] = (
    await prisma.settlement.findMany({
      where: { groupId },
      orderBy: { date: "desc" },
    })
  ).map((settlement: Settlement) => ({
    ...settlement,
    amount: Number(settlement.amount),
  }));

  // members
  const memberIds = group.members.map((m) => m.userId);

  const users: User[] = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, image: true },
  });

  const userMap = Object.fromEntries(users.map((user) => [user.id, user]));

  const members = group.members.map((m) => ({
    id: m.userId,
    name: userMap[m.userId]?.name ?? "Unknown",
    image: userMap[m.userId]?.image ?? null,
    role: m.role,
  }));

  // ledger
  const { totals, ledger } = initializeLedger(memberIds);

  applyExpensesToLedger(expenses, totals, ledger);
  applySettlementsToLedger(settlements, totals, ledger);
  netLedger(memberIds, ledger);

  // balances
  const balances = members.map((member) => ({
    ...member,
    totalBalance: totals[member.id],
    owes: Object.entries(ledger[member.id])
      .filter(([, amount]) => amount > 0)
      .map(([to, amount]) => ({ to, amount })),
    owedBy: memberIds
      .filter((other) => ledger[other][member.id] > 0)
      .map((other) => ({
        from: other,
        amount: ledger[other][member.id],
      })),
  }));

  const userLookupMap = Object.fromEntries(
    members.map((member) => [member.id, member])
  );

  return {
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
    },
    members,
    expenses,
    settlements,
    balances,
    userLookupMap,
  };
};

export const getGroupOrMembers = async ({ groupId }: { groupId?: string }) => {
  const currentUser = await getCurrentUser();

  // get user groups
  const groups: GroupWithMembers[] = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId: currentUser.id,
        },
      },
    },
    include: {
      members: true,
    },
    orderBy: {
      name: "desc",
    },
  });

  const groupSummaries = groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    memberCount: group.members.length,
  }));

  // no group selected
  if (!groupId) {
    return {
      selectedGroup: null,
      groups: groupSummaries,
    };
  }

  // selected group
  const selectedGroup = groups.find((group) => group.id === groupId);

  if (!selectedGroup) {
    throw new Error("Group not found or you're not a member");
  }

  // member details
  const memberIds = selectedGroup.members.map((member) => member.userId);

  const users: Pick<User, "id" | "name" | "email" | "image">[] =
    await prisma.user.findMany({
      where: {
        id: { in: memberIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

  const userMap = Object.fromEntries(users?.map((user) => [user.id, user]));

  const members = selectedGroup.members.map((member) => ({
    id: member.userId,
    name: userMap[member.userId]?.name ?? "Unknown",
    email: userMap[member.userId]?.email ?? null,
    image: userMap[member.userId]?.image ?? null,
    role: member.role,
  }));

  return {
    selectedGroup: {
      id: selectedGroup.id,
      name: selectedGroup.name,
      description: selectedGroup.description,
      createdBy: selectedGroup.createdById,
      members,
    },
    groups: groupSummaries,
  };
};
