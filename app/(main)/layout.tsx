import { UserSessionContextProvider } from "@/context/UserSessionContextProvider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");
  return (
    <UserSessionContextProvider value={session}>
      <div className="container mx-auto mt-24 mb-20 px-4">{children}</div>
    </UserSessionContextProvider>
  );
};

export default MainLayout;
