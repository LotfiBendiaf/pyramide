"use client";

import Globe from "../Globe";
import { SectionHeader } from "../SectionHeader";
import { StatCounter } from "../StatCounter";

export default function GlobalImpactSection() {
  return (
    <section className="relative w-full py-24 bg-black overflow-hidden">
      {/* Globe */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
        <Globe />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <SectionHeader
          title="Notre Attendance Globale"
          subtitle="Connecter des acheteurs potentiels avec des vendeurs de qualité"
          className="text-secondary"
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <StatCounter value={2_400} label="Ventes" suffix="+" />
          <StatCounter value={50} label="Active Agents" />
          <StatCounter value={45_0} label="Biens actifs" suffix="+" />
          <StatCounter value={3_20} label="Leads mensuel" suffix="+" />
        </div>
      </div>
    </section>
  );
}
