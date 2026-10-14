"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import FisheriesCharts from "@/components/charts/fisheries-charts";
import {
  AgenciesSection,
  ComparisonSection,
  ProfileSection,
  ReliefSection,
  ReportsSection,
  SeasonsSection,
  SummaryBar,
} from "@/components/map/marine-sections";

const MarineDashboard = dynamic(() => import("@/components/map/marine-dashboard"), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-slate-200 rounded-xl h-[560px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-ocean-blue border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-ocean-navy font-medium text-sm">Loading marine GIS dashboard…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        {/* hero */}
        <section className="bg-gradient-to-r from-ocean-deep via-ocean-blue to-ocean-green pt-12 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              Marine Fisheries GIS · Southern India
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Marine Fisheries GIS Dashboard
            </h1>
            <p className="text-lg text-ocean-sand max-w-3xl mx-auto">
              Government-grade marine fisheries map for Andhra Pradesh, Karnataka, Kerala and Tamil Nadu — coastal
              boundaries, fishing villages, harbours, seasonal bans, habitats and welfare schemes in one interactive
              dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-white/85">
              <span>🛰 Esri satellite &amp; OSM street basemaps</span>
              <span>Layers: administrative · infrastructure · seasons · habitats · biodiversity</span>
              <span>Merges live O3L platform stats when available</span>
            </div>
          </div>
        </section>

        {/* summary modules */}
        <SummaryBar />

        {/* map workspace */}
        <section id="map" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 scroll-mt-24">
          <MarineDashboard />
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
          <ComparisonSection />

          <section aria-label="Fisheries charts">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ocean-navy">Fisheries at a glance</h2>
              <p className="text-sm text-ocean-text-secondary mt-1">
                Fleet composition and coastal indicators across the four states.
              </p>
            </div>
            <FisheriesCharts />
          </section>

          <ProfileSection />
          <AgenciesSection />
          <SeasonsSection />
          <ReliefSection />
          <ReportsSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
