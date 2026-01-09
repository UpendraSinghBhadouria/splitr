import { ExpenseWithSplits, Settlement } from "@/lib/prisma.types";
import { Debt, Ledger } from "@/types";

export const applyExpenseEffects = (
  ledger: Ledger,
  userId: string,
  expenses: ExpenseWithSplits[]
) => {
  for (const exp of expenses) {
    if (exp.paidByUserId === userId) {
      applyUserPaidExpense(ledger, exp, userId);
    } else {
      applyOtherPaidExpense(ledger, exp, userId);
    }
  }
};

export const applyOtherPaidExpense = (
  ledger: Ledger,
  exp: ExpenseWithSplits,
  userId: string
) => {
  const split = exp.splits.find((s) => s.userId === userId && !s.paid);
  if (!split) return;

  const entry = ledger.get(exp.paidByUserId) ?? {
    amount: 0,
    since: exp.date,
  };

  entry.amount += Number(split.amount);
  entry.since = new Date(Math.min(entry.since.getTime(), exp.date.getTime()));

  ledger.set(exp.paidByUserId, entry);
};

export const applyUserPaidExpense = (
  ledger: Ledger,
  exp: ExpenseWithSplits,
  userId: string
) => {
  for (const split of exp.splits) {
    if (split.userId === userId || split.paid) continue;

    const entry = ledger.get(split.userId) ?? {
      amount: 0,
      since: exp.date,
    };

    entry.amount -= Number(split.amount);
    ledger.set(split.userId, entry);
  }
};

export const applySettlementEffects = (
  ledger: Ledger,
  settlements: Settlement[],
  userId: string
) => {
  for (const st of settlements) {
    if (st.paidByUserId === userId) {
      adjustLedger(ledger, st.receivedByUserId, -Number(st.amount));
    } else if (st.receivedByUserId === userId) {
      adjustLedger(ledger, st.paidByUserId, Number(st.amount));
    }
  }
};

export const adjustLedger = (
  ledger: Ledger,
  counterpartyId: string,
  delta: number
) => {
  const entry = ledger.get(counterpartyId);
  if (!entry) return;

  entry.amount += delta;
  if (entry.amount === 0) {
    ledger.delete(counterpartyId);
  } else {
    ledger.set(counterpartyId, entry);
  }
};

export const extractDebts = (
  ledger: Ledger,
  userMap: Map<string, { name: string; id: string; email: string }>
): Debt[] =>
  Array.from(ledger.entries())
    .filter(([, v]) => v.amount > 0)
    .map(([userId, v]) => ({
      userId,
      name: userMap.get(userId)?.name ?? "Unknown",
      amount: v.amount,
      since: v.since,
    }));
