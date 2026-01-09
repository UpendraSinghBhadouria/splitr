import { Bell, CreditCard, PieChart, Receipt, Users } from "lucide-react";
import React, { ComponentType, SVGProps } from "react";

export interface FeatureItem {
  title: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  bg: string;
  color: string;
  description: string;
}

export interface StepItem {
  label: string;
  title: string;
  description: string;
}

export interface TestimonialItem {
  quote: string;
  name: string;
  image: string;
  role: string;
}

export const FEATURES: FeatureItem[] = [
  {
    title: "Group Expenses",
    Icon: Users,
    bg: "bg-green-100",
    color: "text-green-600",
    description:
      "Create groups for roommates, trips, or events to keep expenses organized.",
  },
  {
    title: "Smart Settlements",
    Icon: CreditCard,
    bg: "bg-teal-100",
    color: "text-teal-600",
    description:
      "Our algorithm minimises the number of payments when settling up.",
  },
  {
    title: "Expense Analytics",
    Icon: PieChart,
    bg: "bg-green-100",
    color: "text-green-600",
    description:
      "Track spending patterns and discover insights about your shared costs.",
  },
  {
    title: "Payment Reminders",
    Icon: Bell,
    bg: "bg-amber-100",
    color: "text-amber-600",
    description:
      "Automated reminders for pending debts and insights on spending patterns.",
  },
  {
    title: "Multiple Split Types",
    Icon: Receipt,
    bg: "bg-green-100",
    color: "text-green-600",
    description:
      "Split equally, by percentage, or by exact amounts to fit any scenario.",
  },
  {
    title: "Real-time Updates",
    Icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        className={props.className}
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 14v8M15 14v8M9 2v6M15 2v6" />
      </svg>
    ),
    bg: "bg-teal-100",
    color: "text-teal-600",
    description:
      "See new expenses and repayments the moment your friends add them.",
  },
];

export const STEPS: StepItem[] = [
  {
    label: "1",
    title: "Create or Join a Group",
    description:
      "Start a group for your roommates, trip, or event and invite friends.",
  },
  {
    label: "2",
    title: "Add Expenses",
    description:
      "Record who paid and how the bill should be split amongst members.",
  },
  {
    label: "3",
    title: "Settle Up",
    description: "View who owes what and log payments when debts are cleared.",
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    quote: "This AI-powered Splitwise clone makes expense tracking effortless!",
    name: "Rahul Mehta",
    image: "/testimonials/rahul.png",
    role: "Product Manager",
  },
  {
    quote: "An impressive full-stack implementation with thoughtful UX!",
    name: "Ananya Sharma",
    image: "/testimonials/ananya.jpg",
    role: "Senior Full Stack Developer",
  },
  {
    quote: "Finally, a smarter and more intuitive way to split expenses!",
    name: "Vikram Patel",
    image: "/testimonials/vikram.png",
    role: "Startup Founder",
  },
];
