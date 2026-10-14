"use client";

import * as React from "react";
import Link from "next/link";
import { Search, BookOpen, MapPin, Mic, Camera, Users, Calendar, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  guideSpecies,
  educationPosts,
  events,
  oceanSounds,
  marineSightings,
  profiles,
  users,
  getVillage,
} from "@/lib/data";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  category: string;
  categoryColor: string;
}

function searchAll(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  const results: SearchResult[] = [];

  guideSpecies.forEach((s) => {
    if (
      s.common_name.toLowerCase().includes(q) ||
      s.tamil_name.toLowerCase().includes(q) ||
      s.scientific_name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: s.id,
        title: s.common_name,
        description: `${s.scientific_name} — ${s.description.slice(0, 100)}...`,
        href: `/guides/${s.slug || s.id}`,
        icon: BookOpen,
        category: "Guides",
        categoryColor: "bg-ocean-blue/10 text-ocean-blue",
      });
    }
  });

  educationPosts.forEach((p) => {
    if (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    ) {
      results.push({
        id: p.id,
        title: p.title,
        description: p.content.slice(0, 120) + "...",
        href: `/education/${p.slug || p.id}`,
        icon: FileText,
        category: "Education",
        categoryColor: "bg-ocean-green/10 text-ocean-green",
      });
    }
  });

  events.forEach((e) => {
    if (
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: e.id,
        title: e.title,
        description: e.description.slice(0, 120) + "...",
        href: `/events/${e.id}`,
        icon: Calendar,
        category: "Events",
        categoryColor: "bg-ocean-warning/10 text-ocean-warning",
      });
    }
  });

  oceanSounds.forEach((s) => {
    if (
      s.description.toLowerCase().includes(q) ||
      s.instrument.toLowerCase().includes(q)
    ) {
      results.push({
        id: s.id,
        title: `${s.instrument} — ${s.duration}s`,
        description: s.description,
        href: `/sounds`,
        icon: Mic,
        category: "Sounds",
        categoryColor: "bg-ocean-coral/10 text-ocean-coral",
      });
    }
  });

  marineSightings.forEach((s) => {
    const contributor = users.find((u) => u.id === s.contributor_id);
    const village = getVillage(s.village_id);
    const searchString = `${s.location} ${s.behavior} ${s.species_id}`.toLowerCase();
    if (searchString.includes(q)) {
      results.push({
        id: s.id,
        title: s.location,
        description: `${s.behavior} — ${s.count} observed`,
        href: `/sightings`,
        icon: Camera,
        category: "Sightings",
        categoryColor: "bg-ocean-navy/10 text-ocean-navy",
      });
    }
  });

  profiles.forEach((p) => {
    const u = users.find((usr) => usr.id === p.user_id);
    if (!u) return;
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    if (
      fullName.includes(q) ||
      p.occupation.toLowerCase().includes(q) ||
      p.bio.toLowerCase().includes(q)
    ) {
      results.push({
        id: p.id,
        title: `${u.first_name} ${u.last_name}`,
        description: `${p.occupation} — ${p.bio.slice(0, 100)}...`,
        href: `/community/members`,
        icon: Users,
        category: "Community",
        categoryColor: "bg-ocean-coral/10 text-ocean-coral",
      });
    }
  });

  return results.slice(0, 20);
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [prevOpen, setPrevOpen] = React.useState(open);
  const [prevQuery, setPrevQuery] = React.useState(query);
  const results = React.useMemo(() => searchAll(query), [query]);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveCategory(null);
    }
  }

  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveCategory(null);
  }

  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [open]);

  const categories = React.useMemo(() => {
    const cats = new Map<string, number>();
    results.forEach((r) => {
      cats.set(r.category, (cats.get(r.category) || 0) + 1);
    });
    return Array.from(cats.entries());
  }, [results]);

  const filteredResults = activeCategory
    ? results.filter((r) => r.category === activeCategory)
    : results;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}
      {open && (
        <div
          role="dialog"
          aria-label="Search"
          aria-modal="true"
          className="fixed inset-x-0 top-0 z-[60] animate-fade-in"
        >
          <div className="mx-auto max-w-2xl mt-20 sm:mt-24 px-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-ocean-border/60 overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-ocean-border/60">
                <Search className="h-5 w-5 text-ocean-muted shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search species, posts, events, people..."
                  className="flex-1 text-base text-ocean-navy placeholder:text-ocean-muted outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") onOpenChange(false);
                  }}
                />
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-lg hover:bg-ocean-light transition-colors text-ocean-muted"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Category filters */}
              {categories.length > 0 && (
                <div className="flex items-center gap-2 px-5 py-3 border-b border-ocean-border/60 bg-ocean-foam/50">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      activeCategory === null
                        ? "bg-ocean-blue text-white"
                        : "bg-white text-ocean-text-secondary hover:bg-ocean-light border border-ocean-border/60"
                    )}
                  >
                    All ({results.length})
                  </button>
                  {categories.map(([cat, count]) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                        activeCategory === cat
                          ? "bg-ocean-blue text-white"
                          : "bg-white text-ocean-text-secondary hover:bg-ocean-light border border-ocean-border/60"
                      )}
                    >
                      {cat} ({count})
                    </button>
                  ))}
                </div>
              )}

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {query.length < 2 && (
                  <div className="px-5 py-12 text-center text-ocean-muted">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Type at least 2 characters to search</p>
                    <p className="text-xs mt-1 opacity-70">
                      Search across species, education, events, sounds, sightings & community
                    </p>
                  </div>
                )}

                {query.length >= 2 && filteredResults.length === 0 && (
                  <div className="px-5 py-12 text-center text-ocean-muted">
                    <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs mt-1 opacity-70">
                      Try a different search term
                    </p>
                  </div>
                )}

                {filteredResults.map((result) => {
                  const Icon = result.icon;
                  return (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => onOpenChange(false)}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-ocean-foam transition-colors border-b border-ocean-border/30 last:border-0"
                    >
                      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", result.categoryColor)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ocean-navy truncate">
                            {result.title}
                          </span>
                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0", result.categoryColor)}>
                            {result.category}
                          </span>
                        </div>
                        <p className="text-xs text-ocean-muted mt-0.5 line-clamp-1">
                          {result.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Footer */}
              {query.length >= 2 && filteredResults.length > 0 && (
                <div className="px-5 py-3 border-t border-ocean-border/60 bg-ocean-foam/30">
                  <p className="text-xs text-ocean-muted text-center">
                    {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
