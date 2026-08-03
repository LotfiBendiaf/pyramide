import ContactSection from "@/components/sections/ContactSection";
import GlobalImpactSection from "@/components/sections/GlobalImpactSection";
import Hero from "@/components/sections/Hero";
import ListingsSection from "@/components/sections/Listings";
import PremiumListings from "@/components/sections/PremiumListings";
import AboutSection from "@/components/sections/AboutSection";
import ReviewsSection from "@/components/sections/ReviewsSection";
import ExpertiseSection from "@/components/sections/ExpertiseSection";

import React from "react";
import Navbar from "@/components/navigation/Navbar";
import MapSection from "@/components/sections/MapSection";

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
      <AboutSection />
      <div className="container mx-auto">
        <ListingsSection searchParams={searchParams} />
      </div>
      <ExpertiseSection />
      <GlobalImpactSection />

      <div className="container mx-auto space-y-10">
        <PremiumListings />
        <ReviewsSection />
        <MapSection />
      </div>
      <ContactSection />
    </main>
  );
};

export default page;
