"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUserSessionContext } from "@/hooks";
import { GetGroupExpenses } from "@/types";

interface GroupMembersProperties {
  members: GetGroupExpenses["members"];
}

export const GroupMembers = ({ members }: GroupMembersProperties) => {
  const { user: currentUser } = useUserSessionContext();

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No members in this group
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = member.id === currentUser?.id;
        const isAdmin = member.role === "admin";

        return (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.image ?? ""} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{member.name}</span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs py-0 h-5">
                      You
                    </Badge>
                  )}
                </div>
                {isAdmin && (
                  <span className="text-xs text-muted-foreground">Admin</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
