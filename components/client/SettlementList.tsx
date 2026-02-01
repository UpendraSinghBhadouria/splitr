"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import { useUserSessionContext } from "@/hooks";
import { getPaymentDisplay } from "@/helper";
import { SettlementWithNumberAmount } from "@/types";

interface SettlementListProperties {
  settlements: SettlementWithNumberAmount[];
  isGroupSettlement?: boolean;
  userLookupMap: {
    [k: string]: {
      id: string;
      name: string;
      image: string | null;
    };
  };
}

export const SettlementList = ({
  settlements,
  isGroupSettlement = false,
  userLookupMap,
}: SettlementListProperties) => {
  const { user: currentUser } = useUserSessionContext();

  if (!settlements?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No settlements found
        </CardContent>
      </Card>
    );
  }

  // Helper to get user details from cache or look up
  const getUserDetails = (userId: string) => {
    // Simplified fallback
    return {
      name:
        userId === currentUser?.id
          ? "You"
          : userLookupMap[userId]?.name || "Other User",
      id: userId,
    };
  };

  return (
    <div className="flex flex-col gap-4">
      {settlements.map((settlement) => {
        const payer = getUserDetails(settlement.paidByUserId);
        const receiver = getUserDetails(settlement.receivedByUserId);
        const isCurrentUserPayer = settlement.paidByUserId === currentUser?.id;
        const isCurrentUserReceiver =
          settlement.receivedByUserId === currentUser?.id;

        const { title, label, labelClassName } = getPaymentDisplay(
          isCurrentUserPayer,
          isCurrentUserReceiver,
          payer.name,
          receiver.name,
        );

        return (
          <Card
            className="hover:bg-muted/30 transition-colors"
            key={settlement.id}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Settlement icon */}
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <span>
                        {format(new Date(settlement.date), "MMM d, yyyy")}
                      </span>
                      {settlement.note && (
                        <>
                          <span>•</span>
                          <span>{settlement.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium">
                    &#8377;{settlement.amount.toFixed(2)}
                  </div>
                  {isGroupSettlement ? (
                    <Badge variant="outline" className="mt-1">
                      Group settlement
                    </Badge>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <span className={labelClassName}>{label}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
