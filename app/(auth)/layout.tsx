import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-[inherit] flex-col items-center justify-center bg-linear-to-br from-blue-50 to-green-50 pt-16">
      <div className="flex w-full max-w-md flex-col">{children}</div>
    </div>
  );
}
