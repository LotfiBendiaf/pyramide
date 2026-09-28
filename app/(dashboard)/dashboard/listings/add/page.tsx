import ListingForm from "@/components/forms/listing-form";
import { SectionHeader } from "@/components/SectionHeader";
import React from "react";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";

const page = async () => {
  const user = await getUserBySessionEmail();
  const canManagePublication = user.data?.role === "ADMIN" || user.data?.role === "DEVELOPER";
  return (
    <div>
      <SectionHeader
        title="Ajouter un bien"
        subtitle="Renseignez les détails du bien"
      />
      <ListingForm canManagePublication={canManagePublication} />
    </div>
  );
};

export default page;
