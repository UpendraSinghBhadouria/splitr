"use server";

import { headers } from "next/headers";
import { auth } from "../lib/auth";
import { redirect } from "next/navigation";

export const signUp = async (name: string, email: string, password: string) => {
  await auth.api.signUpEmail({
    body: { name, email, password, callbackURL: "/dashboard" },
  });
  redirect("/dashboard");
};

export const signIn = async (email: string, password: string) => {
  await auth.api.signInEmail({
    body: { email, password, callbackURL: "/dashboard" },
  });
  redirect("/dashboard");
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
