import type { Prisma } from "./generated/prisma/client";

export type {
  Settlement,
  User,
  Group,
  Prisma,
  GroupMember,
  Expense,
  ExpenseSplit,
} from "./generated/prisma/client";

export type ExpenseWithSplits = Prisma.ExpenseGetPayload<{
  include: { splits: true };
}>;

export type GroupWithMembers = Prisma.GroupGetPayload<{
  include: { members: true };
}>;

export type UserLite = Prisma.UserGetPayload<{
  select: { id: true; name: true; email: true };
}>;
