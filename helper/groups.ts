export type BalanceMeta = {
  colorClass: string;
  amountText: string;
  label: string;
};

export const getBalanceMeta = (balance: number): BalanceMeta => {
  if (balance > 0) {
    return {
      colorClass: "text-green-600",
      amountText: `+$${balance.toFixed(2)}`,
      label: "You are owed money",
    };
  }

  if (balance < 0) {
    return {
      colorClass: "text-red-600",
      amountText: `-$${Math.abs(balance).toFixed(2)}`,
      label: "You owe money",
    };
  }

  return {
    colorClass: "",
    amountText: "$0.00",
    label: "You are all settled up",
  };
};
