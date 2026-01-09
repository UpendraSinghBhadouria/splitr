type LedgerEntry = { amount: number; since: Date };
export type Ledger = Map<string, LedgerEntry>;

export type Debt = {
  userId: string;
  name: string;
  amount: number;
  since: Date;
};
