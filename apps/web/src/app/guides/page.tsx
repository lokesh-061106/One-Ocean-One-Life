"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decodeEntities, hasRichHtml, RichContent } from "@/components/ui/rich-content";
import { guideCategories, guideSpecies, getGuideCategory } from "@/lib/data";
import { fetchCmsList, resolveStr, type ApiSpecies, type ApiGuideCategory } from "@/lib/api-helpers";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// GuideSpecies minted from approved local_knowledge contributions live in this
// category; they get their own section further down the page.
const COMMUNITY_CATEGORY_SLUG = "community-knowledge";

const statusMap: Record<string, string> = {
  LC: "Least Concern", VU: "Vulnerable", EN: "Endangered", CR: "Critically Endangered",
};

const statusColors: Record<string, string> = {
  "Least Concern": "bg-ocean-green text-white",
  Vulnerable: "bg-ocean-warning text-white",
  Endangered: "bg-ocean-danger text-white",
  "Critically Endangered": "bg-red-700 text-white",
};

interface Species {
  id: string;
  slug: string;
  category_id: string;
  category_slug?: string;
  common_name: string;
  scientific_name: string;
  description: string;
  conservation_status: string;
  image: string;
}

function mapSpecies(api: ApiSpecies): Species {
  const cat = typeof api.category === "object" ? api.category : null;
  const image = api.image || "";
  return {
    id: api.id,
    slug: api.slug || api.id,
    category_id: cat?.id || "",
    category_slug: cat?.slug || "",
    common_name: api.common_name,
    scientific_name: api.scientific_name,
    description: api.description,
    conservation_status: statusMap[api.conservation_status] || api.conservation_status,
    image: image || cat?.icon || "🐟",
  };
}

function mapCategory(api: ApiGuideCategory) {
  return { id: api.id, name: api.name, name_tamil: api.name_tamil, slug: api.slug, icon: api.icon, description: api.description, count: api.species_count ?? 0 };
}

export default function GuidesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [species, setSpecies] = useState<Species[]>(guideSpecies);
  const [categories, setCategories] = useState(guideCategories);

  useEffect(() => {
    async function load() {
      const [apiSpecies, apiCats] = await Promise.all([
        fetchCmsList<ApiSpecies>("/guides/species/"),
        fetchCmsList<ApiGuideCategory>("/guides/categories/"),
      ]);
      if (apiSpecies.length > 0) {
        const seen = new Set<string>();
        const unique = apiSpecies.filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        setSpecies(unique.map(mapSpecies));
      }
      if (apiCats.length > 0) setCategories(apiCats.map(mapCategory));
    }
    load();
  }, []);

  const communitySpecies = species.filter((s) => s.category_slug === COMMUNITY_CATEGORY_SLUG);

  const filteredSpecies = species.filter((s) => {
    if (s.category_slug === COMMUNITY_CATEGORY_SLUG) return false;
    const matchesSearch =
      s.common_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.scientific_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || s.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <section className="bg-gradient-to-r from-ocean-deep to-ocean-blue py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Marine Knowledge Base</Badge>
            <h1 className="text-4xl font-bold text-white mb-4">Ocean Guides</h1>
            <p className="text-lg text-ocean-sand max-w-2xl mx-auto">Learn about {species.length}+ marine species, habitats, and ecosystems along the Tamil Nadu coast.</p>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
              <Input placeholder="Search species, habitats..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-ocean-navy mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <Card
                  key={cat.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${selectedCategory === cat.id ? "ring-2 ring-ocean-blue" : ""}`}
                  onClick={() => {
                    if (cat.slug === COMMUNITY_CATEGORY_SLUG) {
                      document.getElementById("community-knowledge")?.scrollIntoView({ behavior: "smooth" });
                      return;
                    }
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{cat.icon}</div>
                    <h3 className="font-semibold text-ocean-navy text-sm">{cat.name}</h3>
                    <p className="text-xs text-ocean-text-secondary">{cat.count} species</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-ocean-navy">Species ({filteredSpecies.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpecies.map((sp) => {
                const category = categories.find((c) => c.id === sp.category_id);
                const isImage = /^(https?:|\/)/.test(sp.image);
                return (
                  <Link key={sp.id} href={`/guides/${sp.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                      <div className="bg-gradient-to-br from-ocean-blue to-ocean-green h-40 flex items-center justify-center overflow-hidden">
                        {isImage ? (
                          <img src={sp.image} alt={sp.common_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="text-6xl group-hover:scale-105 transition-transform">{sp.image}</span>
                        )}
                      </div>
                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-ocean-navy group-hover:text-ocean-blue transition-colors">{sp.common_name}</h3>
                            {sp.scientific_name && <p className="text-sm text-ocean-text-secondary italic">{sp.scientific_name}</p>}
                          </div>
                          {sp.conservation_status && <Badge className={statusColors[sp.conservation_status]}>{sp.conservation_status}</Badge>}
                        </div>
                        {sp.description &&
                          (hasRichHtml(sp.description) ? (
                            <RichContent content={sp.description} className="text-sm text-ocean-text-secondary mb-3 flex-1" />
                          ) : (
                            <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-2 flex-1">{decodeEntities(sp.description)}</p>
                          ))}
                        <div className="flex items-center justify-between">
                          {category && <Badge variant="secondary">{category.name}</Badge>}
                          <Button variant="ghost" size="sm"><Eye className="mr-1 h-4 w-4" />View</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {communitySpecies.length > 0 && (
            <section id="community-knowledge" className="mt-16 scroll-mt-24">
              <div className="rounded-xl border border-ocean-border bg-white p-6 mb-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-ocean-warning/10 p-2">
                    <BookOpen className="h-5 w-5 text-ocean-warning" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-ocean-navy">Community Knowledge</h2>
                    <p className="text-sm text-ocean-text-secondary">
                      Traditional ecological knowledge shared by fishers and coastal residents, verified by the O3L team.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communitySpecies.map((sp) => {
                  const isImage = /^(https?:|\/)/.test(sp.image);
                  return (
                    <Link key={sp.id} href={`/guides/${sp.slug}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full">
                        <div className="bg-gradient-to-br from-ocean-warning to-ocean-coral h-40 flex items-center justify-center overflow-hidden">
                          {isImage ? (
                            <img src={sp.image} alt={sp.common_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <span className="text-6xl group-hover:scale-105 transition-transform">{sp.image}</span>
                          )}
                        </div>
                        <CardContent className="p-6 flex flex-col flex-1">
                          <h3 className="font-semibold text-ocean-navy group-hover:text-ocean-blue transition-colors mb-2">{sp.common_name}</h3>
                          {sp.description &&
                            (hasRichHtml(sp.description) ? (
                              <RichContent content={sp.description} className="text-sm text-ocean-text-secondary mb-3 flex-1" />
                            ) : (
                              <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-3 flex-1">{decodeEntities(sp.description)}</p>
                            ))}
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">Community Knowledge</Badge>
                            <Button variant="ghost" size="sm"><Eye className="mr-1 h-4 w-4" />View</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
