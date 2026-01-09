import { ArrowRight } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

export const CallToAction = () => {
  return (
    <section className="py-20 gradient">
      <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
          Ready to simplify expense sharing?
        </h2>
        <p className="mx-auto max-w-150 text-green-100 md:text-xl/relaxed">
          Join thousands of users who have made splitting expenses stress‑free.
        </p>
        <Button asChild size="lg" className="bg-green-800 hover:opacity-90">
          <Link href="/dashboard">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
};
