import ClientCreateForm from "@/components/forms/client-form";
import { SectionHeader } from "@/components/SectionHeader";
import React from "react";

const page = () => {
  return (
    <div>
      <SectionHeader
        title="Ajouter un client"
        subtitle="Renseignez les détails du client"
      />
      <ClientCreateForm />
    </div>
  );
};

export default page;
