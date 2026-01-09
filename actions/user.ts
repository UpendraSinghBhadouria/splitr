"use server";

import { headers } from "next/headers";
import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { User } from "../lib/generated/prisma/client";
import { UserLite } from "@/types";

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;

  if (!user) {
    throw new Error("No current user found");
  }

  return user;
};

export const searchUsers = async (query: string): Promise<UserLite[]> => {
  const currentUser = await getCurrentUser();

  // Don't search if query is too short
  if (!query || query.length < 2) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          id: {
            not: currentUser.id,
          },
        },
        {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    take: 20,
  });

  return users;
};
