"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Calendar, MapPin, Users, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { events as eventsData, getVillage } from "@/lib/data";
import { fetchCmsList, resolveName, resolveStr, type ApiEvent } from "@/lib/api-helpers";
import { stripHtml } from "@/components/ui/rich-content";

const typeColors: Record<string, string> = {
  cleanup: "bg-ocean-green text-white",
  workshop: "bg-ocean-blue text-white",
  research: "bg-ocean-coral text-white",
  awareness: "bg-ocean-warning text-white",
  fishing_knowledge: "bg-ocean-navy text-white",
  community_meeting: "bg-ocean-info text-white",
  education: "bg-ocean-green text-white",
  tourism: "bg-ocean-blue text-white",
};

interface Event {
  id: string;
  slug?: string;
  title: string;
  type: string;
  description: string;
  location: string;
  village_name: string;
  organizer_name: string;
  start_date: string;
  end_date: string | null;
  max_participants: number;
  participants_count: number;
}

function mapEvent(api: ApiEvent): Event {
  return {
    id: api.id,
    slug: api.slug,
    title: api.title,
    type: api.event_type,
    description: stripHtml(api.description),
    location: api.location_name || api.village_name || resolveStr(api.village),
    village_name: api.village_name || resolveStr(api.village),
    organizer_name: api.organizer_name || resolveName(api.organizer),
    start_date: api.start_date,
    end_date: api.end_date,
    max_participants: api.max_participants ?? 0,
    participants_count: api.participant_count ?? 0,
  };
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function load() {
      const apiEvents = await fetchCmsList<ApiEvent>("/community/events/");
      if (apiEvents.length > 0) {
        const newestFirst = [...apiEvents].sort((a, b) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        );
        setEvents(newestFirst.map(mapEvent));
      } else {
        setEvents(
          eventsData.map((e) => {
            const village = getVillage(e.village_id);
            return {
              id: e.id,
              title: e.title,
              type: e.type,
              description: e.description,
              location: e.location,
              village_name: village?.name || "",
              organizer_name: "",
              start_date: e.start_date,
              end_date: e.end_date,
              max_participants: e.max_participants,
              participants_count: e.participants_count,
            };
          })
        );
      }
    }
    load();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All" || event.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <section className="bg-gradient-to-r from-ocean-deep to-ocean-blue py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Community Events</Badge>
            <h1 className="text-4xl font-bold text-white mb-4">Events</h1>
            <p className="text-lg text-ocean-sand max-w-2xl mx-auto">Join {events.length}+ community events, workshops, and conservation activities.</p>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" /><Input placeholder="Search events..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <Button><Plus className="mr-2 h-4 w-4" />Create Event</Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            {["All", "cleanup", "workshop", "research", "education", "awareness", "community_meeting"].map((type) => (
              <Button key={type} variant={selectedType === type ? "default" : "outline"} size="sm" onClick={() => setSelectedType(type)}>
                {type === "All" ? "All" : type.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const capacityPercent = Math.round((event.participants_count / event.max_participants) * 100);
              return (
                <Link key={event.id} href={`/events/${event.slug || event.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                    <div className="bg-gradient-to-br from-ocean-blue to-ocean-green p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={typeColors[event.type]}>{event.type.replace(/_/g, " ")}</Badge>
                        <span className="text-sm text-white/80">{event.start_date.split("T")[0]}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-ocean-sand transition-colors">{event.title}</h3>
                      <p className="text-sm text-white/80 line-clamp-2">{event.description}</p>
                    </div>
                    <CardContent className="p-6">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-ocean-text-secondary"><Calendar className="h-4 w-4 text-ocean-blue" /><span>{event.start_date.split("T")[0]} at {event.start_date.split("T")[1]?.slice(0, 5)}</span></div>
                        <div className="flex items-center gap-2 text-sm text-ocean-text-secondary"><MapPin className="h-4 w-4 text-ocean-blue" /><span>{event.location}</span></div>
                        <div className="flex items-center gap-2 text-sm text-ocean-text-secondary"><Users className="h-4 w-4 text-ocean-blue" /><span>{event.participants_count}/{event.max_participants} participants</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="h-2 bg-ocean-light rounded-full overflow-hidden">
                          <div className="h-full bg-ocean-green rounded-full" style={{ width: `${capacityPercent}%` }} />
                        </div>
                      </div>
                      <Button className="w-full">Join Event</Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
