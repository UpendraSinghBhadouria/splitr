import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const ProfilePage = () => {
  return (
    <div className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <h1 className="mt-4 text-5xl gradient-title">
          Profile Page Coming Soon!
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
          Sorry, this page is under construction. We&apos;re working hard to
          bring you an amazing experience.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
