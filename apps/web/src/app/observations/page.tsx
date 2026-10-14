"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Telescope, User, Eye, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCmsList, mediaUrl, type ApiObservation } from "@/lib/api-helpers";
import { LocationDisplay } from "@/components/location-display";

const CATEGORY_LABELS: Record<string, string> = {
  animal: "Animal",
  plant: "Plant / algae",
  pollution: "Pollution",
  debris: "Marine debris",
  habitat: "Habitat",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  animal: "bg-ocean-blue/10 text-ocean-blue",
  plant: "bg-ocean-green/10 text-ocean-green",
  pollution: "bg-ocean-danger/10 text-ocean-danger",
  debris: "bg-ocean-warning/10 text-ocean-warning",
  habitat: "bg-ocean-coral/10 text-ocean-coral",
  other: "bg-ocean-muted/10 text-ocean-text-secondary",
};

const CATEGORY_FILTERS = ["animal", "plant", "pollution", "debris", "habitat", "other"];

export default function ObservationsPage() {
  const [observations, setObservations] = useState<ApiObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    let cancelled = false;
    const query = activeCategory ? `?observation_category=${activeCategory}` : "";
    fetchCmsList<ApiObservation>(`/observations/${query}`).then((data) => {
      if (!cancelled) {
        setObservations(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <section className="bg-gradient-to-r from-ocean-coral to-ocean-warning py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              Community Eyes on the Coast
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">Observations</h1>
            <p className="text-lg text-ocean-sand max-w-2xl mx-auto">
              Pollution, habitats, plants and wildlife spotted by coastal communities.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory("")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeGroupClass(activeCategory === "")
              }`}
            >
              All
            </button>
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category === activeCategory ? "" : category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeGroupClass(activeCategory === category)
                }`}
              >
                {CATEGORY_LABELS[category] ?? category}
              </button>
            ))}
          </div>

          {loading && (
            <div className="text-center py-16 text-ocean-text-secondary">Loading observations...</div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {observations.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  {item.photo ? (
                    <img
                      src={mediaUrl(item.photo)}
                      alt={item.observation_display || "Observation"}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-ocean-coral/10 to-ocean-warning/10 h-48 flex items-center justify-center">
                      <Telescope className="h-12 w-12 text-ocean-coral/30" />
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-ocean-navy text-lg">
                        {item.observation_display || item.organism_name || "Observation"}
                      </h3>
                    </div>

                    {item.organism_name && item.observation_display !== item.organism_name && (
                      <p className="text-sm text-ocean-text-secondary italic mb-2">{item.organism_name}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm text-ocean-text-secondary mb-3">
                      {item.observation_category && (
                        <Badge className={CATEGORY_COLORS[item.observation_category] ?? ""}>
                          {item.category_display ?? CATEGORY_LABELS[item.observation_category] ?? item.observation_category}
                        </Badge>
                      )}
                    </div>

                    {item.notes && <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-3">{item.notes}</p>}

                    <div className="flex items-center gap-3 text-sm text-ocean-text-secondary pt-3 border-t border-ocean-border flex-wrap">
                      {item.contributor && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.contributor}
                        </span>
                      )}
                      {item.village_name && <LocationDisplay name={item.village_name} showCoords={false} size="sm" />}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {observations.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Telescope className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
                  <p className="text-lg text-ocean-text-secondary mb-4">
                    {activeCategory
                      ? "No observations in this category yet."
                      : "No observations shared yet. Be the first to add one!"}
                  </p>
                  <Button asChild>
                    <Link href="/contributions">
                      <Plus className="mr-2 h-4 w-4" />
                      Add an Observation
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function activeGroupClass(active: boolean): string {
  return active
    ? "bg-ocean-blue text-white"
    : "bg-white text-ocean-text-secondary border border-ocean-border hover:border-ocean-blue hover:text-ocean-blue";
}
