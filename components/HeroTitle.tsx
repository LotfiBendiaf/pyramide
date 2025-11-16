"use client";

import { motion } from "framer-motion";

export default function HeroMaskTitle() {
  return (
    <div className="text-center overflow-hidden">
      {/* Line 1 */}
      <motion.h1
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-6xl font-bold tracking-tight syncopate"
      >
        Pyramide
      </motion.h1>

      {/* Line 2 */}
      <motion.h2
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="text-xl font-medium mt-2 syncopate"
      >
        Agence Immobilière
      </motion.h2>
    </div>
  );
}
