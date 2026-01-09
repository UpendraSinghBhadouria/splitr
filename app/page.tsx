import {
  CallToAction,
  Features,
  Footer,
  Hero,
  HowItWorks,
  Testimonials,
} from "@/components/server";

export default function Home() {
  return (
    <div className="flex flex-col pt-16">
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CallToAction />
      <Footer />
    </div>
  );
}
