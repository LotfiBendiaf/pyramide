"use client";

import Globe from "../Globe";
import { SectionHeader } from "../SectionHeader";
import { StatCounter } from "../StatCounter";

export default function GlobalImpactSection() {
  return (
    <section
      id="impact"
      className="relative w-full overflow-hidden bg-[#0c0b0a] py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-45">
        <Globe />
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0c0b0a]/70 via-transparent to-[#0c0b0a]/90"
        aria-hidden="true"
      />

      <div className="relative z-10 container mx-auto px-4">
        <SectionHeader
          title="Notre portée"
          subtitle="Des résultats concrets portés par notre réseau, notre connaissance du marché et la confiance de nos clients."
          watermark="IMPACT"
          className="mb-12 text-white md:mb-16 [&_p]:text-white/55"
        />

        <div className="mx-auto grid max-w-4xl grid-cols-1 divide-y divide-white/10 border-y border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <StatCounter value={50_0} label="Transactions" suffix="+" />
          <StatCounter value={10} label="Agents actifs" />
          <StatCounter value={45_0} label="Biens actifs" suffix="+" />
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-5 tracking-wide text-white/40">
          Des indicateurs qui reflètent un engagement quotidien sur le terrain.
        </p>
      </div>
    </section>
  );
}
