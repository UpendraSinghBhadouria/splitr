"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signUp, socialSignIn } from "@/actions";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { GitHubIcon, GoogleIcon } from "@/components/icons";

const signUpSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async ({
    email,
    password,
    name,
  }: z.infer<typeof signUpSchema>) => {
    try {
      await signUp(name, email, password);
    } catch (error) {
      console.error("Sign Up Error:", error);
      setError(`Sign up failed. ${(error as Error).message}`);
    } finally {
      form.reset();
    }
  };

  const handleSocialAuth = async (provider: "google" | "github") => {
    try {
      await socialSignIn(provider);
    } catch (error) {
      setError(`Social sign in failed: ${(error as Error).message}`);
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Card className="border-gray-300 bg-linear-to-br from-blue-50 to-green-50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Create Account
        </CardTitle>
        <CardDescription className="text-gray-600">
          Sign up to get started with Splitr
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Form {...form}>
          <Button
            variant="outline"
            className="w-full border-gray-300 h-10"
            onClick={() => handleSocialAuth("google")}
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>

          <Button
            className="w-full bg-slate-900 hover:bg-slate-800 border-gray-300 text-white h-10"
            onClick={() => handleSocialAuth("github")}
          >
            <GitHubIcon className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center z-0">
              <div className="w-full border-t border-gray-300" />
            </div>

            <div className="relative flex justify-center text-sm z-10">
              <span className="px-2 bg-linear-to-br from-blue-50 to-green-50 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      className="border-gray-300 focus-visible:ring-green-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="border-gray-300 focus-visible:ring-green-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="border-gray-300 focus-visible:ring-green-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div role="alert" className="text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className={cn(
                "w-full bg-green-600 hover:bg-green-700 border-none text-white h-10",
                isLoading && "opacity-70 cursor-not-allowed "
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-indigo-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
