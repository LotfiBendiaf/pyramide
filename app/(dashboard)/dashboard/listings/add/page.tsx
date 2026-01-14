import ListingForm from "@/components/forms/listing-form";
import { SectionHeader } from "@/components/SectionHeader";
import React from "react";

const page = () => {
  return (
    <div>
      <SectionHeader
        title="Ajouter un bien"
        subtitle="Renseignez les détails du bien"
      />
      <ListingForm />
    </div>
  );
};

export default page;
