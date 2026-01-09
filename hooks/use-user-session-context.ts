import { UserSessionContext } from "@/context";
import { useContext } from "react";

export const useUserSessionContext = () => {
  const context = useContext(UserSessionContext);

  if (!context) {
    throw new Error(
      "useUserSessionContext must be used within a UserSessionContextProvider"
    );
  }

  return context;
};
