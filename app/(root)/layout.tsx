import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import React, { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="relative scroll-smooth">
      <Navbar />
      {children}
      <Footer />
    </main>
  );
};

export default layout;
