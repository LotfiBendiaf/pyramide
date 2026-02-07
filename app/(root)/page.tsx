import ContactSection from "@/components/sections/ContactSection";
import GlobalImpactSection from "@/components/sections/GlobalImpactSection";
import Hero from "@/components/sections/Hero";
import ListingsSection from "@/components/sections/Listings";
import PremiumListings from "@/components/sections/PremiumListings";
import AboutSection from "@/components/sections/AboutSection";
import ExpertiseSection from "@/components/sections/ExpertiseSection";

import React from "react";
import Navbar from "@/components/navigation/Navbar";

type ListingsSectionProps = {
  searchParams?: {
    city?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
  };
};

const page = ({ searchParams }: ListingsSectionProps) => {
  return (
    <main>
      <Navbar />

      <Hero />
      <div className="container mx-auto">
        <ListingsSection searchParams={searchParams} />
      </div>
      <ExpertiseSection />
      <GlobalImpactSection />
      <AboutSection />
      <div className="container mx-auto space-y-10">
        <PremiumListings />
        <ContactSection />
      </div>
    </main>
  );
};

export default page;
