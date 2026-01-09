"use server";

import prisma from "../lib/prisma";
import { getCurrentUser } from "./user";
import { ExpenseSplit, User, Group, GroupMember } from "../lib/prisma.types";

export const getAllContacts = async () => {
  const currentUser = await getCurrentUser();

  const expensesYouPaid = await prisma.expense.findMany({
    where: {
      paidByUserId: currentUser.id,
      groupId: null,
    },
    include: {
      splits: true,
    },
  });

  const expensesNotPaidByYou = await prisma.expense.findMany({
    where: {
      paidByUserId: { not: currentUser.id },
      groupId: null,
      splits: {
        some: {
          userId: currentUser.id,
        },
      },
    },
    include: {
      splits: true,
    },
  });

  const personalExpenses = [...expensesYouPaid, ...expensesNotPaidByYou];

  const contactIdsSet = new Set<string>();

  personalExpenses.forEach((expense) => {
    if (expense.paidByUserId !== currentUser.id) {
      contactIdsSet.add(expense.paidByUserId);
    }
    expense.splits?.forEach((split: ExpenseSplit) => {
      if (split.userId !== currentUser.id) {
        contactIdsSet.add(split.userId);
      }
    });
  });

  const contactsUsers: User[] = await prisma.user.findMany({
    where: {
      id: { in: Array.from(contactIdsSet) },
    },
  });

  const userGroups: (Group & { members: GroupMember[] })[] =
    await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      include: { members: true },
    });

  contactsUsers.sort((a, b) => a.name.localeCompare(b.name));
  userGroups.sort((a, b) => a.name.localeCompare(b.name));

  return {
    users: contactsUsers.filter(Boolean),
    groups: userGroups,
  };
};

interface CreateGroupInput {
  name: string;
  members: string[];
  description?: string;
}

export const createGroup = async ({
  name,
  members,
  description,
}: CreateGroupInput) => {
  const currentUser = await getCurrentUser();

  if (!name) {
    throw new Error("Group name is required");
  }

  const uniqueMembers = new Set<string>(members);
  uniqueMembers.add(currentUser.id);

  const existingUsers: User[] = await prisma.user.findMany({
    where: {
      id: { in: Array.from(uniqueMembers) },
    },
  });

  if (existingUsers.length !== uniqueMembers.size) {
    const existingUserIds = existingUsers.map((user) => user.id);
    const invalidUserIds = Array.from(uniqueMembers).filter(
      (id) => !existingUserIds.includes(id)
    );
    throw new Error(
      `The following user IDs are invalid: ${invalidUserIds.join(", ")}`
    );
  }

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? "",
      createdById: currentUser.id,
      members: {
        create: Array.from(uniqueMembers).map((id) => ({
          userId: id,
          role: id === currentUser.id ? "admin" : "member",
          joinedAt: new Date(),
        })),
      },
    },
    include: { members: true },
  });

  return group;
};
