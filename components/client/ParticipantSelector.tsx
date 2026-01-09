"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserLite } from "@/types";
import { useServerAction, useUserSessionContext } from "@/hooks";
import { searchUsers } from "@/actions";

interface ParticipantSelectorProperties {
  participants: UserLite[];
  onParticipantsChange: Dispatch<SetStateAction<UserLite[]>>;
}
export const ParticipantSelector = ({
  participants,
  onParticipantsChange,
}: ParticipantSelectorProperties) => {
  const { user: currentUser } = useUserSessionContext();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Search for users
  const {
    create: search,
    data: searchResults,
    isLoading,
  } = useServerAction(searchUsers, {
    auto: false,
    method: "POST",
  });

  useEffect(() => {
    search?.(searchQuery);
  }, [search, searchQuery]);

  // Add a participant
  const addParticipant = (user: UserLite) => {
    // Check if already added
    if (participants.some((p) => p.id === user.id)) {
      return;
    }

    // Add to list
    onParticipantsChange([...participants, user]);
    setOpen(false);
    setSearchQuery("");
  };

  // Remove a participant
  const removeParticipant = (userId: string) => {
    // Don't allow removing yourself
    if (userId === currentUser.id) {
      return;
    }

    onParticipantsChange(participants.filter((p) => p.id !== userId));
  };

  const message = (() => {
    if (searchQuery.length < 2) {
      return "Type at least 2 characters to search";
    }

    if (isLoading) {
      return "Searching...";
    }

    return "No users found";
  })();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {participants.map((participant) => (
          <Badge
            key={participant.id}
            variant="secondary"
            className="flex items-center gap-2 px-3 py-2"
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={participant.image ?? ""} />
              <AvatarFallback>
                {participant.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span>
              {participant.id === currentUser?.id
                ? "You"
                : participant.name || participant.email}
            </span>
            {participant.id !== currentUser?.id && (
              <button
                type="button"
                onClick={() => removeParticipant(participant.id)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {participants.length < 2 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                type="button"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add person
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                      {message}
                    </p>
                  </CommandEmpty>
                  <CommandGroup heading="Users">
                    {searchResults?.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.name + user.email}
                        onSelect={() => addParticipant(user)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.image ?? ""} />
                            <AvatarFallback>
                              {user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};
