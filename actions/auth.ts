"use server";

import { headers } from "next/headers";
import { auth } from "../lib/auth";
import { redirect } from "next/navigation";

export const signUp = async (name: string, email: string, password: string) => {
  try {
    await auth.api.signUpEmail({
      body: { name, email, password, callbackURL: "/dashboard" },
    });

    return { success: true, message: "Account created successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Sign up failed.",
    };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: { email, password, callbackURL: "/dashboard" },
    });

    return { success: true, message: "Signed in successfully." };
  } catch (error) {
    return { success: false, message: "Invalid email or password." };
  }
};

export const socialSignIn = async (provider: "google" | "github") => {
  const { url } = await auth.api.signInSocial({
    body: { provider, callbackURL: "/dashboard" },
  });
  if (url) redirect(url);
};

export const signOut = async () => {
  const result = await auth.api.signOut({
    headers: await headers(),
  });
  return result;
};
