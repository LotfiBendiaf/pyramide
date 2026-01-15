import { SectionCards } from "@/components/dashboard/CardsSection";
import React from "react";

import data from "./data.json";
import { Chart } from "@/components/dashboard/ChartAreaInteractive";
import { DataTable } from "@/components/dashboard/DataTable";

const page = () => {
  return (
    <main className="container mx-auto space-y-10">
      <SectionCards />
      <Chart />
      <DataTable data={data} />
    </main>
  );
};

export default page;
