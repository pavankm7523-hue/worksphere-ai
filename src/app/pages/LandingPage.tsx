import React from "react";
import { PageWrapper } from "../components/shared/PageWrapper";
import { LandingNav } from "../components/landing/LandingNav";
import { HeroSection } from "../components/landing/HeroSection";
import { StatsSection } from "../components/landing/StatsSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { AICapabilitiesSection } from "../components/landing/AICapabilitiesSection";
import { TestimonialsSection } from "../components/landing/TestimonialsSection";
import { FAQSection } from "../components/landing/FAQSection";
import { ContactSection } from "../components/landing/ContactSection";
import { Footer } from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <PageWrapper>
      <LandingNav />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AICapabilitiesSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </PageWrapper>
  );
}
