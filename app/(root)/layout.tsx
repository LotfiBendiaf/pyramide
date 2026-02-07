import Footer from "@/components/navigation/Footer";
import React, { ReactNode } from "react";

const layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="relative scroll-smooth">
      {children}
      <Footer />
    </main>
  );
};

export default layout;
