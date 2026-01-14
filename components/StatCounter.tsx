"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

interface StatCounterProps {
  value: number;
  label: string;
  suffix?: string;
}

export function StatCounter({ value, label, suffix = "" }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("en-US").format(
          Math.round(latest)
        );
      }
    });

    return () => unsubscribe();
  }, [springValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center p-6 
                 bg-white/5 backdrop-blur-md border border-white/10 
                 rounded-lg shadow-xl"
    >
      <span className="text-4xl md:text-5xl font-bold text-white flex">
        <span ref={ref}>0</span>
        {suffix}
      </span>

      <p className="text-muted-foreground mt-2 font-medium uppercase tracking-wider text-sm text-center">
        {label}
      </p>
    </motion.div>
  );
}
