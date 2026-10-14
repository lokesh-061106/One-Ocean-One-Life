"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Waves,
  Fish,
  MapPin,
  Users,
  BookOpen,
  Mic,
  Camera,
  Trophy,
  ArrowRight,
  TrendingUp,
  Globe,
  Heart,
  Shield,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: BookOpen,
    title: "Ocean Guides",
    description: "Learn about marine species, habitats, and ecosystems along the Tamil Nadu coast.",
    href: "/guides",
    color: "bg-ocean-blue",
  },
  {
    icon: MapPin,
    title: "Ocean Map",
    description: "Explore observations, hotspots, and coastal zones with interactive mapping.",
    href: "/map",
    color: "bg-ocean-green",
  },
  {
    icon: Users,
    title: "Community",
    description: "Connect with fishermen, researchers, and coastal communities.",
    href: "/community/members",
    color: "bg-ocean-coral",
  },
  {
    icon: Mic,
    title: "Ocean Sounds",
    description: "Listen to citizen-science ocean recordings from coastal areas.",
    href: "/sounds",
    color: "bg-ocean-blue",
  },
  {
    icon: Camera,
    title: "Marine Sightings",
    description: "Discover and report marine mammal sightings near you.",
    href: "/sightings",
    color: "bg-ocean-green",
  },
  {
    icon: Trophy,
    title: "Recognition",
    description: "Celebrating coastal contributors and communities making a difference.",
    href: "/recognition",
    color: "bg-ocean-warning",
  },
];

const stats = [
  { label: "People Engaged", value: "142,820+", icon: Users },
  { label: "Coastal Villages", value: "612", icon: MapPin },
  { label: "Verified Observations", value: "1.2M+", icon: TrendingUp },
  { label: "Marine Sightings", value: "184K+", icon: Fish },
];

const impactAreas = [
  {
    icon: Globe,
    title: "Ocean Conservation",
    description: "Protecting marine ecosystems through community-driven data collection and awareness.",
  },
  {
    icon: Heart,
    title: "Community Empowerment",
    description: "Building coastal livelihoods through knowledge sharing and collaborative research.",
  },
  {
    icon: Shield,
    title: "Marine Protection",
    description: "Safeguarding endangered species and their habitats along the Tamil Nadu coast.",
  },
  {
    icon: Zap,
    title: "Citizen Science",
    description: "Empowering everyday people to contribute to scientific research and understanding.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ocean-deep via-ocean-blue to-ocean-green">
          <div className="absolute inset-0 bg-[url('/wave-pattern.svg')] opacity-10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
                🌊 Tamil Nadu Coastal Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                One Ocean One Life
              </h1>
              <p className="text-xl md:text-2xl text-ocean-sand mb-4">
                Connect. Learn. Contribute. Protect.
              </p>
              <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
                Connecting coastal communities, fishermen, researchers, NGOs, educators,
                vendors and institutions to collectively understand and protect the ocean.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" className="bg-ocean-green hover:bg-ocean-green/90 text-white" asChild>
                  <Link href="/register">
                    Join O3L
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
<Button size="xl" variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-ocean-deep" asChild>
                  <Link href="/guides">
                    Explore Guides
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Wave decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32V120H1392C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120H0V64Z" fill="var(--color-ocean-foam)"/>
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-ocean-foam">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-ocean-light flex items-center justify-center">
                        <Icon className="h-6 w-6 text-ocean-blue" />
                      </div>
                      <div className="text-3xl font-bold text-ocean-navy mb-1">{stat.value}</div>
                      <div className="text-sm text-ocean-text-secondary">{stat.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-ocean-navy mb-4">
                Explore O3L Platform
              </h2>
              <p className="text-lg text-ocean-text-secondary max-w-2xl mx-auto">
                Discover tools and features designed to help you understand and protect our ocean.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link key={index} href={feature.href}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-ocean-navy mb-2 group-hover:text-ocean-blue transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-ocean-text-secondary">
                          {feature.description}
                        </p>
                        <div className="mt-4 flex items-center text-ocean-blue font-medium group-hover:gap-2 transition-all">
                          Learn more
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section className="py-20 bg-ocean-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-ocean-navy mb-4">
                Making an Impact
              </h2>
              <p className="text-lg text-ocean-text-secondary max-w-2xl mx-auto">
                Our platform is transforming how coastal communities engage with ocean conservation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {impactAreas.map((area, index) => {
                const Icon = area.icon;
                return (
                  <Card key={index} className="bg-white border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center mb-4">
                        <Icon className="h-5 w-5 text-ocean-blue" />
                      </div>
                      <h3 className="font-semibold text-ocean-navy mb-2">{area.title}</h3>
                      <p className="text-sm text-ocean-text-secondary">{area.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-ocean-deep to-ocean-blue">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-ocean-sand mb-8 max-w-2xl mx-auto">
              Join thousands of coastal community members who are already contributing
              to ocean conservation through the O3L platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="bg-ocean-green hover:bg-ocean-green/90 text-white" asChild>
                <Link href="/register">
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-ocean-deep" asChild>
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
