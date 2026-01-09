import { auth } from "@/lib/auth";
import { createContext } from "react";

export type UserSessionContextType = typeof auth.$Infer.Session | null;

export const UserSessionContext = createContext<UserSessionContextType>(null);
