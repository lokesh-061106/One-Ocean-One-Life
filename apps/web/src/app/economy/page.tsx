"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function EconomyPage() {
  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main className="flex min-h-screen flex-col">
        {/* Hero Section - matching about page pattern */}
        <section className="bg-gradient-to-r from-ocean-deep to-ocean-blue py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              Circular Economy
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Circular Economy
            </h1>
            <p className="text-xl text-ocean-sand max-w-3xl mx-auto mb-8">
              Transform ocean waste into income. Discover business ideas, government schemes,
              and training workshops designed for coastal communities and sustainable growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button size="lg" className="bg-ocean-green hover:bg-ocean-green/90 text-white" asChild>
                <Link href="/register">Join Our Mission <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-ocean-navy text-ocean-navy hover:bg-ocean-navy/10" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SHG Sections Grid */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-xl transition-shadow duration-300 border-0">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-ocean-navy group-hover:text-ocean-forest transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ocean-navy mb-3 group-hover:text-ocean-forest transition-colors">
                  Circular Economy
                </h3>
                <p className="text-base text-ocean-navy flex-1 line-clamp-3">
                  Transform ocean waste into income. Business ideas, government schemes,
                  and training workshops for coastal communities.
                </p>
                <Badge className="mt-auto px-3 py-1.5 text-sm text-ocean-navy bg-ocean-navy/10">
                  <Link href="/economy/shg/circular-economy" className="underline underline-offset-2 text-ocean-navy hover:text-ocean-forest transition-colors">
                    Learn More
                  </Link>
                </Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-shadow duration-300 border-0">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-ocean-navy group-hover:text-ocean-forest transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ocean-navy mb-3 group-hover:text-ocean-forest transition-colors">
                  Deepening the Model
                </h3>
                <p className="text-base text-ocean-navy flex-1 line-clamp-3">
                  Explore advanced circular business models and implementation strategies for maximum environmental and economic impact.
                </p>
                <Badge className="mt-auto px-3 py-1.5 text-sm text-ocean-navy bg-ocean-navy/10">
                  <Link href="/economy/shg/strategies" className="underline underline-offset-2 text-ocean-navy hover:text-ocean-forest transition-colors">
                    Learn More
                  </Link>
                </Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-shadow duration-300 border-0">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-ocean-navy group-hover:text-ocean-forest transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ocean-navy mb-3 group-hover:text-ocean-forest transition-colors">
                  Revenue Opportunities
                </h3>
                <p className="text-base text-ocean-navy flex-1 line-clamp-3">
                  Unlock new revenue streams from waste valorization, product life extension,
                  and resource recovery systems for your SHG.
                </p>
                <Badge className="mt-auto px-3 py-1.5 text-sm text-ocean-navy bg-ocean-navy/10">
                  <Link href="/economy/shg/revenue" className="underline underline-offset-2 text-ocean-navy hover:text-ocean-forest transition-colors">
                    Learn More
                  </Link>
                </Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-shadow duration-300 border-0">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-ocean-navy group-hover:text-ocean-forest transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ocean-navy mb-3 group-hover:text-ocean-forest transition-colors">
                  Loans & Financial Support
                </h3>
                <p className="text-base text-ocean-navy flex-1 line-clamp-3">
                  Access government schemes, microfinance options, and circular economy
                  funding programs tailored for fisherwomen SHGs.
                </p>
                <Badge className="mt-auto px-3 py-1.5 text-sm text-ocean-navy bg-ocean-navy/10">
                  <Link href="/economy/shg/loans" className="underline underline-offset-2 text-ocean-navy hover:text-ocean-forest transition-colors">
                    Learn More
                  </Link>
                </Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-shadow duration-300 border-0">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-ocean-navy group-hover:text-ocean-forest transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ocean-navy mb-3 group-hover:text-ocean-forest transition-colors">
                  Recipes & Food Marketing
                </h3>
                <p className="text-base text-ocean-navy flex-1 line-clamp-3">
                  Develop value-added food products, preservation techniques, and market
                  connections for sustainable seafood and agricultural processing.
                </p>
                <Badge className="mt-auto px-3 py-1.5 text-sm text-ocean-navy bg-ocean-navy/10">
                  <Link href="/economy/shg/recipes" className="underline underline-offset-2 text-ocean-navy hover:text-ocean-forest transition-colors">
                    Learn More
                  </Link>
                </Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-shadow duration-300 border-0">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-ocean-navy group-hover:text-ocean-forest transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ocean-navy mb-3 group-hover:text-ocean-forest transition-colors">
                  Fresh Fish Marketing
                </h3>
                <p className="text-base text-ocean-navy flex-1 line-clamp-3">
                  Learn direct-to-consumer sales, value-chain optimization, and quality
                  certification for fresh catch and seafood products.
                </p>
                <Badge className="mt-auto px-3 py-1.5 text-sm text-ocean-navy bg-ocean-navy/10">
                  <Link href="/economy/shg/fresh-fish" className="underline underline-offset-2 text-ocean-navy hover:text-ocean-forest transition-colors">
                    Learn More
                  </Link>
                </Badge>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-shadow duration-300 border-0">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-ocean-navy group-hover:text-ocean-forest transition-colors"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ocean-navy mb-3 group-hover:text-ocean-forest transition-colors">
                  Sea to Plate to Prosperity
                </h3>
                <p className="text-base text-ocean-navy flex-1 line-clamp-3">
                  End-to-end journey mapping from sea harvest to plate, covering
                  logistics, cold-chain, branding, and consumer education.
                </p>
                <Badge className="mt-auto px-3 py-1.5 text-sm text-ocean-navy bg-ocean-navy/10">
                  <Link href="/economy/shg/sea-to-plate" className="underline underline-offset-2 text-ocean-navy hover:text-ocean-forest transition-colors">
                    Learn More
                  </Link>
                </Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Initiatives - matching about page pattern */}
        <section className="py-16 md:py-24 bg-ocean-foam">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-ocean-navy mb-8 text-center">
              Featured Initiatives
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 border-y border-ocean-border/20 hover:bg-ocean-navy/5 transition-colors">
                <CardContent>
                  <h4 className="font-bold text-ocean-navy mb-2">Business Ideas</h4>
                  <p className="text-ocean-navy text-sm">
                    Innovative concepts for circular business models
                  </p>
                </CardContent>
              </Card>
              <Card className="p-6 border-y border-ocean-border/20 hover:bg-ocean-navy/5 transition-colors">
                <CardContent>
                  <h4 className="font-bold text-ocean-navy mb-2">Government Schemes</h4>
                  <p className="text-ocean-navy text-sm">
                    Eligible programs and funding opportunities
                  </p>
                </CardContent>
              </Card>
              <Card className="p-6 border-y border-ocean-border/20 hover:bg-ocean-navy/5 transition-colors">
                <CardContent>
                  <h4 className="font-bold text-ocean-navy mb-2">Training Workshops</h4>
                  <p className="text-ocean-navy text-sm">
                    Hands-on skills for sustainable practices
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}