import ReviewQuote from "@/components/ReviewQuote";
import Hero from "@/components/sections/Hero";
import ListingsSection from "@/components/sections/Listings";

import React from "react";

const page = () => {
  return (
    <main>
      <Hero />
      <div className="container mx-auto">
        <ListingsSection />
        <ReviewQuote />
      </div>
    </main>
  );
};

export default page;
