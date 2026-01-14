import GlobalImpactSection from "@/components/sections/GlobalImpactSection";
import Hero from "@/components/sections/Hero";
import ListingsSection from "@/components/sections/Listings";

import React from "react";

const page = () => {
  return (
    <main>
      <Hero />
      <div className="container mx-auto">
        <ListingsSection />
      </div>
      <GlobalImpactSection />
    </main>
  );
};

export default page;
