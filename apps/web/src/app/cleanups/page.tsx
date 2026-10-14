"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Users, Scale, User, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchCmsList, type ApiBeachCleanup } from "@/lib/api-helpers";

export default function CleanupsPage() {
  const [cleanups, setCleanups] = useState<ApiBeachCleanup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchCmsList<ApiBeachCleanup>("/ecotourism/cleanups/").then((data) => {
      if (!cancelled) {
        setCleanups(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalWaste = cleanups.reduce((sum, c) => sum + (c.waste_collected_kg || 0), 0);
  const totalPeople = cleanups.reduce((sum, c) => sum + (c.participants_count || 0), 0);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <section className="bg-gradient-to-r from-ocean-green to-ocean-deep py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              Coastal Clean-ups
            </Badge>
            <h1 className="text-4xl font-bold text-white mb-4">Beach Clean-ups</h1>
            <p className="text-lg text-ocean-sand max-w-2xl mx-auto">
              Community clean-up drives recorded along the coast.
            </p>
          </div>
        </section>

        {!loading && cleanups.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pt-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-ocean-border p-6 text-center">
                <p className="text-3xl font-bold text-ocean-navy">{cleanups.length}</p>
                <p className="text-sm text-ocean-text-secondary">Clean-ups recorded</p>
              </div>
              <div className="bg-white rounded-xl border border-ocean-border p-6 text-center">
                <p className="text-3xl font-bold text-ocean-green">{totalPeople.toLocaleString()}</p>
                <p className="text-sm text-ocean-text-secondary">Volunteers participated</p>
              </div>
              <div className="bg-white rounded-xl border border-ocean-border p-6 text-center">
                <p className="text-3xl font-bold text-ocean-coral">{Math.round(totalWaste).toLocaleString()} kg</p>
                <p className="text-sm text-ocean-text-secondary">Waste collected</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-12">
          {loading && (
            <div className="text-center py-16 text-ocean-text-secondary">Loading clean-ups...</div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cleanups.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  {item.photos?.[0] ? (
                    <div className="h-32 bg-ocean-foam">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.photos[0].image}
                        alt={item.photos[0].caption || item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-ocean-green/10 to-ocean-deep/10 h-32 flex items-center justify-center">
                      <Trash2 className="h-12 w-12 text-ocean-green/40" />
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-ocean-navy text-lg">
                        <Link
                          href={`/cleanups/${item.slug || item.id}`}
                          className="hover:text-ocean-green transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h3>
                    </div>
                    <p className="text-sm text-ocean-text-secondary mb-2">
                      {new Date(item.cleanup_date).toLocaleDateString()}
                    </p>

                    {item.beach_name && (
                      <p className="text-sm text-ocean-text-secondary mb-3">🏖 {item.beach_name}</p>
                    )}

                    {item.description && (
                      <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-3">{item.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm text-ocean-text-secondary mb-3">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {item.participants_count} people
                      </Badge>
                      <Badge variant="secondary">
                        <Scale className="h-3 w-3 mr-1" />
                        {item.waste_collected_kg} kg
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-ocean-text-secondary pt-3 border-t border-ocean-border flex-wrap">
                      {item.organizer_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.organizer_name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {cleanups.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Trash2 className="h-16 w-16 text-ocean-muted mx-auto mb-4" />
                  <p className="text-lg text-ocean-text-secondary mb-4">
                    No clean-ups recorded yet. Be the first to organise one!
                  </p>
                  <Button asChild>
                    <Link href="/contributions">
                      <Plus className="mr-2 h-4 w-4" />
                      Record a Clean-up
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
