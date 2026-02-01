import React from "react";

type NetBalanceVariant = "row" | "compact";

interface NetBalanceRowProps {
  netBalance: number;
  otherUserName?: string;
  variant?: NetBalanceVariant;
  settledText?: string;
}

export const NetBalanceRow: React.FC<NetBalanceRowProps> = ({
  netBalance,
  otherUserName,
  variant = "row",
  settledText = "Settled up",
}) => {
  const isSettled = netBalance === 0;
  const isPositive = netBalance > 0;
  const amount = Math.abs(netBalance).toFixed(2);

  //  Compact variant
  if (variant === "compact") {
    let text = settledText;
    let color = "";

    if (isPositive) {
      text = `They owe you ₹${amount}`;
      color = "text-green-600";
    } else if (netBalance < 0) {
      text = `You owe ₹${amount}`;
      color = "text-red-600";
    }

    return <div className={`font-medium ${color}`}>{text}</div>;
  }

  //  Row variant
  if (isSettled) {
    return (
      <p>
        You are all settled up
        {otherUserName ? ` with ${otherUserName}` : ""}
      </p>
    );
  }

  const amountColor = isPositive ? "text-green-600" : "text-red-600";

  return (
    <div className={`flex justify-between items-center`}>
      <p>
        {isPositive ? (
          <>
            <span className="font-medium">{otherUserName}</span> owes you
          </>
        ) : (
          <>
            You owe <span className="font-medium">{otherUserName}</span>
          </>
        )}
      </p>
      <span className={`text-xl font-bold ${amountColor}`}>
        &#8377;{amount}
      </span>
    </div>
  );
};
