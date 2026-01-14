"use client";

import { motion } from "framer-motion";

export default function HeroSplitWord() {
  const top = "PYRAMIDE";
  const bottom = "PYRAMIDE";

  return (
    <div className="flex flex-col items-center justify-center text-center mx-auto w-fit">
      {/* TOP HALF */}
      <motion.h1
        initial={{ y: 60, opacity: 1 }}
        animate={{ y: 45, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight uppercase leading-none"
      >
        {top}
      </motion.h1>

      {/* MIDDLE TEXT */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-amber-700 text-lg md:text-xl w-full font-medium uppercase tracking-widest mt-2 mb-2 z-20 p-1"
      >
        Immobilier
      </motion.span>

      {/* BOTTOM HALF */}
      <motion.h1
        initial={{ y: -60, opacity: 1 }}
        animate={{ y: -45, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight uppercase leading-none"
      >
        {bottom}
      </motion.h1>
    </div>
  );
}
