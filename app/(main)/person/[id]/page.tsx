"use client";

import { getExpensesBetweenUsers } from "@/actions";
import { ExpenseList, SettlementList } from "@/components/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServerAction } from "@/hooks";
import { BalanceStatus } from "@/types";
import { ArrowLeft, ArrowLeftRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";

export const getBalanceStatus = (
  balance: number,
  otherUserName?: string,
): BalanceStatus => {
  if (balance === 0) {
    return {
      label: <p>You are all settled up</p>,
      amountClassName: "text-2xl font-bold",
    };
  }

  if (balance > 0) {
    return {
      label: (
        <p>
          <span className="font-medium">{otherUserName}</span> owes you
        </p>
      ),
      amountClassName: "text-2xl font-bold text-green-600",
    };
  }

  return {
    label: (
      <p>
        You owe <span className="font-medium">{otherUserName}</span>
      </p>
    ),
    amountClassName: "text-2xl font-bold text-red-600",
  };
};

const PersonExpensePage = () => {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("expenses");

  const { data, isLoading, fetch } = useServerAction(getExpensesBetweenUsers, {
    auto: false,
  });

  useEffect(() => {
    if (!params.id || !fetch) return;

    fetch?.({ userId: params.id as string });
  }, [fetch, params.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }
  const { otherUser, expenses, settlements, balance } = data || {
    otherUser: null,
    expenses: [],
    settlements: [],
    balance: 0,
  };

  const { label, amountClassName } = getBalanceStatus(balance, otherUser?.name);

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser?.image ?? ""} />
              <AvatarFallback>
                {otherUser?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl gradient-title">{otherUser?.name}</h1>
              <p className="text-muted-foreground">{otherUser?.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/settlements/user/${params.id}`}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Settle up
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/expenses/new`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add expense
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Balance card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>{label}</div>

            <div className={amountClassName}>
              &#8377;{Math.abs(balance).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for expenses and settlements */}
      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            Expenses ({expenses.length})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseList
            expenses={expenses}
            showOtherPerson={false}
            otherPersonId={params.id as string}
            userLookupMap={otherUser ? { [otherUser.id]: otherUser } : {}}
          />
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <SettlementList
            settlements={settlements}
            userLookupMap={otherUser ? { [otherUser.id]: otherUser } : {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonExpensePage;
