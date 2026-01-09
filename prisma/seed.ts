import {
  PrismaClient,
  Prisma,
  User,
  Group,
  Expense,
} from "../lib/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Prisma seed started");

  // Prevent duplicate seeding
  const expenseCount = await prisma.expense.count();
  if (expenseCount > 0) {
    console.log("⚠️ Expenses already exist. Skipping seed.");
    return;
  }

  // Fetch existing users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  if (users.length < 3) {
    throw new Error("At least 3 users are required to seed data");
  }

  const [user1, user2, user3] = users;

  const groups = await createGroups(user1, user2, user3);
  const oneOnOneExpenses = await createOneOnOneExpenses(user1, user2, user3);
  const groupExpenses = await createGroupExpenses(user1, user2, user3, groups);

  await createSettlements(users, groups, oneOnOneExpenses, groupExpenses);

  console.log("✅ Prisma seed completed successfully");
}

//
// ─────────────────────────────────────────────
// GROUPS
// ─────────────────────────────────────────────
//
async function createGroups(
  user1: User,
  user2: User,
  user3: User
): Promise<Group[]> {
  const now = new Date();

  return Promise.all([
    prisma.group.create({
      data: {
        name: "Weekend Trip",
        description: "Expenses for our weekend getaway",
        createdById: user1.id,
        members: {
          create: [
            { userId: user1.id, role: "admin", joinedAt: now },
            { userId: user2.id, role: "member", joinedAt: now },
            { userId: user3.id, role: "member", joinedAt: now },
          ],
        },
      },
    }),
    prisma.group.create({
      data: {
        name: "Office Expenses",
        description: "Shared expenses for our office",
        createdById: user2.id,
        members: {
          create: [
            { userId: user2.id, role: "admin", joinedAt: now },
            { userId: user3.id, role: "member", joinedAt: now },
          ],
        },
      },
    }),
    prisma.group.create({
      data: {
        name: "Project Alpha",
        description: "Expenses for our project",
        createdById: user3.id,
        members: {
          create: [
            { userId: user3.id, role: "admin", joinedAt: now },
            { userId: user1.id, role: "member", joinedAt: now },
            { userId: user2.id, role: "member", joinedAt: now },
          ],
        },
      },
    }),
  ]);
}

//
// ─────────────────────────────────────────────
// ONE-ON-ONE EXPENSES
// ─────────────────────────────────────────────
//
async function createOneOnOneExpenses(
  user1: User,
  user2: User,
  user3: User
): Promise<Expense[]> {
  const now = Date.now();

  const data = [
    {
      description: "Dinner at Indian Restaurant",
      amount: "1250",
      category: "foodDrink",
      date: new Date(now - 14 * 86400000),
      paidBy: user1,
      splits: [
        { userId: user1.id, amount: "625", paid: true },
        { userId: user2.id, amount: "625", paid: false },
      ],
    },
    {
      description: "Cab ride to airport",
      amount: "450",
      category: "transportation",
      date: new Date(now - 7 * 86400000),
      paidBy: user2,
      splits: [
        { userId: user1.id, amount: "225", paid: false },
        { userId: user2.id, amount: "225", paid: true },
      ],
    },
    {
      description: "Movie tickets",
      amount: "500",
      category: "entertainment",
      date: new Date(now - 5 * 86400000),
      paidBy: user3,
      splits: [
        { userId: user2.id, amount: "250", paid: false },
        { userId: user3.id, amount: "250", paid: true },
      ],
    },
    {
      description: "Groceries",
      amount: "1875.5",
      category: "groceries",
      date: new Date(now - 30 * 86400000),
      paidBy: user1,
      splitType: "percentage",
      splits: [
        { userId: user1.id, amount: "1312.85", paid: true },
        { userId: user3.id, amount: "562.65", paid: false },
      ],
    },
    {
      description: "Internet bill",
      amount: "1200",
      category: "utilities",
      date: new Date(now - 3 * 86400000),
      paidBy: user2,
      splits: [
        { userId: user2.id, amount: "600", paid: true },
        { userId: user3.id, amount: "600", paid: false },
      ],
    },
  ];

  const results: Expense[] = [];

  for (const e of data) {
    const expense = await prisma.expense.create({
      data: {
        description: e.description,
        amount: new Prisma.Decimal(e.amount),
        category: e.category,
        date: e.date,
        splitType: e.splitType ?? "equal",
        paidByUserId: e.paidBy.id,
        createdById: e.paidBy.id,
        splits: {
          create: e.splits.map((s) => ({
            userId: s.userId,
            amount: new Prisma.Decimal(s.amount),
            paid: s.paid,
          })),
        },
      },
    });
    results.push(expense);
  }

  return results;
}

//
// ─────────────────────────────────────────────
// GROUP EXPENSES
// ─────────────────────────────────────────────
//
async function createGroupExpenses(
  user1: User,
  user2: User,
  user3: User,
  groups: Group[]
): Promise<Expense[]> {
  const now = Date.now();
  const results: Expense[] = [];

  const expenseData = [
    // Weekend Trip
    {
      description: "Hotel reservation",
      amount: "9500",
      category: "housing",
      date: new Date(now - 14 * 86400000),
      paidBy: user1,
      group: groups[0],
      splits: [
        { userId: user1.id, amount: "3166.67", paid: true },
        { userId: user2.id, amount: "3166.67", paid: false },
        { userId: user3.id, amount: "3166.66", paid: false },
      ],
    },
    {
      description: "Groceries for weekend",
      amount: "2450.75",
      category: "groceries",
      date: new Date(now - 13 * 86400000),
      paidBy: user2,
      group: groups[0],
      splits: [
        { userId: user1.id, amount: "816.92", paid: false },
        { userId: user2.id, amount: "816.92", paid: true },
        { userId: user3.id, amount: "816.91", paid: false },
      ],
    },
    {
      description: "Sight-seeing tour",
      amount: "4500",
      category: "entertainment",
      date: new Date(now - 12 * 86400000),
      paidBy: user3,
      group: groups[0],
      splits: [
        { userId: user1.id, amount: "1500", paid: false },
        { userId: user2.id, amount: "1500", paid: false },
        { userId: user3.id, amount: "1500", paid: true },
      ],
    },

    // Office
    {
      description: "Coffee and snacks",
      amount: "850",
      category: "coffee",
      date: new Date(now - 7 * 86400000),
      paidBy: user2,
      group: groups[1],
      splits: [
        { userId: user2.id, amount: "425", paid: true },
        { userId: user3.id, amount: "425", paid: false },
      ],
    },

    {
      description: "Office supplies",
      amount: 1250.4,
      category: "shopping",
      date: new Date(now - 5 * 24 * 60 * 60 * 1000),
      paidByUserId: user3.id,
      splitType: "equal",
      splits: [
        { userId: user2.id, amount: 625.2, paid: false },
        { userId: user3.id, amount: 625.2, paid: true },
      ],
      groupId: groups[1].id, // Office Expenses Group
      createdBy: user3.id,
    },

    // Project Alpha
    {
      description: "Domain purchase",
      amount: "1200",
      category: "technology",
      date: new Date(now - 5 * 86400000),
      paidBy: user3,
      group: groups[2],
      splits: [
        { userId: user1.id, amount: "400", paid: false },
        { userId: user2.id, amount: "400", paid: false },
        { userId: user3.id, amount: "400", paid: true },
      ],
    },

    {
      description: "Server hosting",
      amount: 3600.0,
      category: "bills",
      date: new Date(now - 4 * 24 * 60 * 60 * 1000),
      paidByUserId: user1.id,
      splitType: "equal",
      splits: [
        { userId: user1.id, amount: 1200.0, paid: true },
        { userId: user2.id, amount: 1200.0, paid: false },
        { userId: user3.id, amount: 1200.0, paid: false },
      ],
      groupId: groups[2].id, // Project Alpha Group
      createdBy: user1.id,
    },
    {
      description: "Project dinner",
      amount: 4800.6,
      category: "foodDrink",
      date: new Date(now - 2 * 24 * 60 * 60 * 1000),
      paidByUserId: user2.id,
      splitType: "percentage",
      splits: [
        { userId: user1.id, amount: 1600.2, paid: false }, // 33.33%
        { userId: user2.id, amount: 1600.2, paid: true }, // 33.33%
        { userId: user3.id, amount: 1600.2, paid: false }, // 33.33%
      ],
      groupId: groups[2].id, // Project Alpha Group
      createdBy: user2.id,
    },
  ];

  for (const e of expenseData) {
    const expense = await prisma.expense.create({
      data: {
        description: e.description,
        amount: new Prisma.Decimal(e.amount),
        category: e.category,
        date: e.date,
        splitType: "equal",
        paidByUserId: e.paidBy?.id ?? e.paidByUserId!,
        createdById: e.paidBy?.id ?? e.createdBy!,
        groupId: e.group?.id ?? e.groupId!,
        splits: {
          create: e.splits.map((s) => ({
            userId: s.userId,
            amount: new Prisma.Decimal(s.amount),
            paid: s.paid,
          })),
        },
      },
    });

    results.push(expense);
  }

  return results;
}

//
// ─────────────────────────────────────────────
// SETTLEMENTS
// ─────────────────────────────────────────────
//
export async function createSettlements(
  users: User[],
  groups: Group[],
  oneOnOneExpenses: Expense[],
  groupExpenses: Expense[]
) {
  const now = Date.now();
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now - 1 * 24 * 60 * 60 * 1000);

  const [user1, user2, user3] = users;

  // Find expenses
  const cabExpense = oneOnOneExpenses.find(
    (e) => e.description === "Cab ride to airport"
  );

  const hotelExpense = groupExpenses.find(
    (e) => e.description === "Hotel reservation"
  );

  const coffeeExpense = groupExpenses.find(
    (e) => e.description === "Coffee and snacks"
  );

  const settlementData: Prisma.SettlementCreateInput[] = [
    // ─────────────────────────────
    // Cab ride settlement
    // user1 → user2
    // ─────────────────────────────
    {
      amount: new Prisma.Decimal("225"),
      note: "For cab ride",
      date: fiveDaysAgo,
      paidByUser: { connect: { id: user1.id } },
      receivedByUser: { connect: { id: user2.id } },
      createdBy: { connect: { id: user1.id } },
      relatedExpenses: cabExpense
        ? {
            create: {
              expense: { connect: { id: cabExpense.id } },
            },
          }
        : undefined,
    },

    // ─────────────────────────────
    // Hotel settlement (Weekend Trip)
    // user2 → user1
    // ─────────────────────────────
    {
      amount: new Prisma.Decimal("3166.67"),
      note: "Hotel payment",
      date: threeDaysAgo,
      paidByUser: { connect: { id: user2.id } },
      receivedByUser: { connect: { id: user1.id } },
      createdBy: { connect: { id: user2.id } },
      group: { connect: { id: groups[0].id } },
      relatedExpenses: hotelExpense
        ? {
            create: {
              expense: { connect: { id: hotelExpense.id } },
            },
          }
        : undefined,
    },

    // ─────────────────────────────
    // Office coffee settlement
    // user3 → user2
    // ─────────────────────────────
    {
      amount: new Prisma.Decimal("425"),
      note: "Office coffee",
      date: yesterday,
      paidByUser: { connect: { id: user3.id } },
      receivedByUser: { connect: { id: user2.id } },
      createdBy: { connect: { id: user3.id } },
      group: { connect: { id: groups[1].id } },
      relatedExpenses: coffeeExpense
        ? {
            create: {
              expense: { connect: { id: coffeeExpense.id } },
            },
          }
        : undefined,
    },
  ];

  const settlements = [];

  for (const data of settlementData) {
    const settlement = await prisma.settlement.create({
      data,
      include: {
        paidByUser: true,
        receivedByUser: true,
        group: true,
        relatedExpenses: {
          include: { expense: true },
        },
      },
    });

    settlements.push(settlement);
  }

  return settlements;
}

//
// ─────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────
//
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
