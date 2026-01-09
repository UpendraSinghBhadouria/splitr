import { ExpenseWithSplits, Group, Settlement } from "@/lib/prisma.types";
import { Balance, UserLite } from "@/types";

export const calculateUserBalances = (
  meId: string,
  otherId: string,
  expenses: ExpenseWithSplits[]
) => {
  let owed = 0;
  let owing = 0;

  for (const exp of expenses) {
    if (exp.paidByUserId === meId) {
      owed += Number(getUnpaidSplit(exp, otherId));
    } else if (exp.paidByUserId === otherId) {
      owing += Number(getUnpaidSplit(exp, meId));
    }
  }

  return { owed, owing };
};

export const applyUserSettlements = (
  balances: { owed: number; owing: number },
  settlements: Settlement[],
  meId: string
) => {
  for (const st of settlements) {
    if (st.paidByUserId === meId) {
      balances.owing = Math.max(0, balances.owing - Number(st.amount));
    } else {
      balances.owed = Math.max(0, balances.owed - Number(st.amount));
    }
  }
};

const getUnpaidSplit = (exp: ExpenseWithSplits, userId: string) =>
  exp.splits.find((s) => s.userId === userId && !s.paid)?.amount ?? 0;

export const calculateGroupBalances = (
  members: { userId: string }[],
  meId: string,
  expenses: ExpenseWithSplits[]
): Record<string, Balance> => {
  const balances = Object.fromEntries(
    members
      .filter((m) => m.userId !== meId)
      .map((m) => [m.userId, { owed: 0, owing: 0 }])
  );

  for (const exp of expenses) {
    if (exp.paidByUserId === meId) {
      exp.splits.forEach((s) => {
        if (!s.paid && balances[s.userId]) {
          balances[s.userId].owed += Number(s.amount);
        }
      });
    } else if (balances[exp.paidByUserId]) {
      balances[exp.paidByUserId].owing += Number(getUnpaidSplit(exp, meId));
    }
  }

  return balances;
};

export const applyGroupSettlements = (
  balances: Record<string, Balance>,
  settlements: Settlement[],
  meId: string
) => {
  for (const st of settlements) {
    if (st.paidByUserId === meId && balances[st.receivedByUserId]) {
      balances[st.receivedByUserId].owing = Math.max(
        0,
        balances[st.receivedByUserId].owing - Number(st.amount)
      );
    }
    if (st.receivedByUserId === meId && balances[st.paidByUserId]) {
      balances[st.paidByUserId].owed = Math.max(
        0,
        balances[st.paidByUserId].owed - Number(st.amount)
      );
    }
  }
};

export const buildSettlementResponse = (
  params:
    | {
        type: "user";
        user: UserLite;
        balance: Balance;
      }
    | {
        type: "group";
        group: Group;
        balances: Record<string, Balance>;
        users: UserLite[];
      }
) => {
  if (params.type === "user") {
    const { user, balance } = params;

    return {
      type: "user",

      counterpart: {
        userId: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },

      youAreOwed: balance.owed,
      youOwe: balance.owing,
      netBalance: balance.owed - balance.owing,

      // explicitly undefined for consistency
      group: undefined,
      balances: undefined,
    };
  }

  // Group settlement response
  const userMap = Object.fromEntries(params.users.map((u) => [u.id, u]));

  return {
    type: "group",

    group: {
      id: params.group.id,
      name: params.group.name,
      description: params.group.description,
    },

    balances: Object.entries(params.balances).map(([userId, b]) => ({
      userId,
      name: userMap[userId]?.name ?? "Unknown",
      image: userMap[userId]?.image ?? null,
      youAreOwed: b.owed,
      youOwe: b.owing,
      netBalance: b.owed - b.owing,
    })),

    // explicitly undefined for consistency
    counterpart: undefined,
    youAreOwed: undefined,
    youOwe: undefined,
    netBalance: undefined,
  };
};
