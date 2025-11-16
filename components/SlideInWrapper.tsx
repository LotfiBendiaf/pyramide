"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Direction = "top" | "bottom" | "left" | "right";

interface SlideInProps {
  from: Direction;
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const getInitial = (from: Direction) => {
  switch (from) {
    case "top":
      return { y: -50, opacity: 0 };
    case "bottom":
      return { y: 50, opacity: 0 };
    case "left":
      return { x: -50, opacity: 0 };
    case "right":
      return { x: 50, opacity: 0 };
    default:
      return { opacity: 0 };
  }
};

export default function SlideIn({
  from,
  children,
  delay = 0,
  duration = 0.4,
  once = true,
  className = "",
}: SlideInProps) {
  return (
    <motion.div
      className={className}
      initial={getInitial(from)}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ delay, duration, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
