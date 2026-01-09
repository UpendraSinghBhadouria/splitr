"use client";

import { FC, ReactNode } from "react";
import {
  UserSessionContext,
  UserSessionContextType,
} from "./user-session-context";

export type UserSessionContextProviderProps = {
  children: ReactNode;
  value: UserSessionContextType;
};

export const UserSessionContextProvider: FC<
  UserSessionContextProviderProps
> = ({ children, value }) => (
  <UserSessionContext.Provider value={value}>
    {children}
  </UserSessionContext.Provider>
);
