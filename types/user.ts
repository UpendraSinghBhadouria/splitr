import { auth } from "@/lib/auth";
import { User as PrismaUser } from "@/lib/prisma.types";

export type User = typeof auth.$Infer.Session.user | null;

export type UserLite = Pick<
  PrismaUser,
  "id" | "name" | "email" | "image"
>;
