import Navbar from "@/components/navigation/Navbar";
import React, { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="relative">
      {" "}
      <Navbar />
      {children}
    </main>
  );
};

export default layout;
