"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "./user";
import { CreateSettlementInput, SettlementDataInput, UserLite } from "@/types";
import { ExpenseWithSplits, GroupWithMembers } from "@/lib/prisma.types";
import {
  applyGroupSettlements,
  applyUserSettlements,
  buildSettlementResponse,
  calculateGroupBalances,
  calculateUserBalances,
} from "@/helper";

export const createSettlement = async ({
  amount,
  note,
  paidByUserId,
  receivedByUserId,
  groupId,
}: CreateSettlementInput) => {
  const currentUser = await getCurrentUser();

  // basic validation
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  if (paidByUserId === receivedByUserId) {
    throw new Error("Payer and receiver cannot be the same user");
  }

  if (currentUser.id !== paidByUserId && currentUser.id !== receivedByUserId) {
    throw new Error("You must be either the payer or the receiver");
  }

  // group membership check
  if (groupId) {
    const group: GroupWithMembers | null = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) throw new Error("Group not found");

    const memberIds = group.members.map((member) => member.userId);
    if (
      !memberIds.includes(paidByUserId) ||
      !memberIds.includes(receivedByUserId)
    ) {
      throw new Error("Both parties must be members of the group");
    }
  }

  // insert settlement
  return prisma.settlement.create({
    data: {
      amount,
      note,
      date: new Date(),
      paidByUserId,
      receivedByUserId,
      groupId: groupId ?? null,
      createdById: currentUser.id,
    },
  });
};

export const getSettlementData = async ({
  entityType,
  entityId,
}: SettlementDataInput) => {
  const me = await getCurrentUser();

  console.log("@@parameters", { entityType, entityId });
  if (entityType === "user") {
    // Prisma Queries
    const other: UserLite | null = await prisma.user.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!other) throw new Error("User not found");

    const expenses: ExpenseWithSplits[] = await prisma.expense.findMany({
      where: {
        groupId: null,
        OR: [{ paidByUserId: me.id }, { paidByUserId: other.id }],
      },
      include: {
        splits: true,
      },
    });

    const settlements = await prisma.settlement.findMany({
      where: {
        groupId: null,
        OR: [{ paidByUserId: me.id }, { paidByUserId: other.id }],
      },
    });

    // Business logic
    const balance = calculateUserBalances(me.id, other.id, expenses);
    applyUserSettlements(balance, settlements, me.id);

    return buildSettlementResponse({
      type: "user",
      user: other,
      balance,
    });
  }

  if (entityType === "group") {
    // Prisma Queries
    const group: GroupWithMembers | null = await prisma.group.findUnique({
      where: { id: entityId },
      include: {
        members: true,
      },
    });

    if (!group) throw new Error("Group not found");

    const isMember = group.members.some((m) => m.userId === me.id);
    if (!isMember) throw new Error("You are not a member of this group");

    const expenses: ExpenseWithSplits[] = await prisma.expense.findMany({
      where: { groupId: group.id },
      include: { splits: true },
    });

    const settlements = await prisma.settlement.findMany({
      where: { groupId: group.id },
    });

    // bussiness logic
    const balances = calculateGroupBalances(group.members, me.id, expenses);

    applyGroupSettlements(balances, settlements, me.id);

    /* ── Prisma lookup for member details (THIS CALL) ─ */
    const users: UserLite[] = await prisma.user.findMany({
      where: { id: { in: Object.keys(balances) } },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
      },
    });

    return buildSettlementResponse({
      type: "group",
      group,
      balances,
      users,
    });
  }

  throw new Error("Invalid entityType");
};
