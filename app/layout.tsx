import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Splitr",
  description: "The smarter way to split expenses with friends.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logos/logo-s.png" />
      </head>
      <body className={`${inter.className}`}>
        <Header session={session} />
        <main className="min-h-screen">
          <Toaster richColors />
          {children}
        </main>
      </body>
    </html>
  );
}
