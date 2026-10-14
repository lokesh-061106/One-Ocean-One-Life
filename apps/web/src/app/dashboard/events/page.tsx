"use client";

import { useState, useEffect, useCallback } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  X,
  ArrowLeft,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrudForm, type Field } from "@/components/ui/crud-form";
import { useDashboardData, type DashboardEvent } from "@/components/dashboard-data-context";
import { fetchCmsList } from "@/lib/api-helpers";
import { formatNumber } from "@/lib/utils";

async function fetchApiEvents(): Promise<DashboardEvent[]> {
  try {
    const items = await fetchCmsList<any>("/community/events/");
    return items.map((e: any) => ({
      id: e.id,
      title: e.title,
      type: e.event_type || "community_meeting",
      date: e.start_date ? e.start_date.split("T")[0] : "",
      village: e.location_name || e.village_name || "",
      participants: e.participant_count || 0,
      maxParticipants: e.max_participants || 100,
      status: e.is_published ? "published" : "draft",
      description: e.description || "",
    }));
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = {
  published: "bg-ocean-green text-white",
  draft: "bg-ocean-muted text-white",
  pending: "bg-ocean-warning text-white",
};

const typeColors: Record<string, string> = {
  cleanup: "bg-ocean-green/10 text-ocean-green",
  workshop: "bg-ocean-blue/10 text-ocean-blue",
  research: "bg-ocean-coral/10 text-ocean-coral",
  awareness: "bg-ocean-warning/10 text-ocean-warning",
  fishing_knowledge: "bg-ocean-navy/10 text-ocean-navy",
  education: "bg-ocean-green/10 text-ocean-green",
  community_meeting: "bg-ocean-info/10 text-ocean-info",
};

const fields: Field[] = [
  { key: "title", label: "Title", type: "text", placeholder: "Enter event title", required: true },
  {
    key: "type",
    label: "Type",
    type: "select",
    placeholder: "Select event type",
    required: true,
    options: [
      { value: "cleanup", label: "Cleanup" },
      { value: "workshop", label: "Workshop" },
      { value: "research", label: "Research" },
      { value: "awareness", label: "Awareness" },
      { value: "fishing_knowledge", label: "Fishing Knowledge" },
    ],
  },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "village", label: "Village", type: "text", placeholder: "Enter village name", required: true },
  { key: "maxParticipants", label: "Max Participants", type: "number", placeholder: "e.g. 100", required: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    required: true,
    options: [
      { value: "published", label: "Published" },
      { value: "draft", label: "Draft" },
      { value: "pending", label: "Pending" },
    ],
  },
  { key: "description", label: "Description", type: "richtext", placeholder: "Optional event description" },
];

export default function DashboardEventsPage() {
  const { events: ctxEvents, addEvent, updateEvent, deleteEvent } = useDashboardData();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const mounted = useHydrated();
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [selectedEvent, setSelectedEvent] = useState<DashboardEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchApiEvents().then(setEvents);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalParticipants = events.reduce((sum, e) => sum + e.participants, 0);
  const publishedCount = events.filter((e) => e.status === "published").length;
  const upcomingCount = mounted ? events.filter((e) => e.date > new Date().toISOString().split("T")[0]).length : 0;

  const handleAdd = () => {
    setSelectedEvent(null);
    setView("add");
  };

  const handleEdit = (event: DashboardEvent) => {
    setSelectedEvent(event);
    setView("edit");
  };

  const handleSave = async (data: Record<string, any>) => {
    if (view === "add") {
      setCreating(true);
      try {
        await addEvent({ ...data, participants: 0 } as Omit<DashboardEvent, "id">);
        showToast("Event created successfully");
      } catch (err: any) {
        showToast(err.message || "Failed to create event on server", "error");
      } finally {
        setCreating(false);
      }
    } else {
      updateEvent(selectedEvent!.id, data);
      showToast("Event updated successfully");
    }
    const fresh = await fetchApiEvents();
    setEvents(fresh);
    setView("list");
    setSelectedEvent(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    deleteEvent(id);
    showToast("Event deleted successfully");
    setTimeout(async () => {
      const fresh = await fetchApiEvents();
      setEvents(fresh);
    }, 300);
  };

  const handleCancel = () => {
    setView("list");
    setSelectedEvent(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all ${
              toast.type === "success" ? "bg-ocean-green" : "bg-ocean-danger"
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {view === "list" ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ocean-navy">Event Management</h1>
                <p className="text-ocean-text-secondary">Manage community events and activities.</p>
              </div>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-ocean-blue" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ocean-navy">{events.length}</p>
                      <p className="text-sm text-ocean-text-secondary">Total Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-green/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-ocean-green" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ocean-navy">{publishedCount}</p>
                      <p className="text-sm text-ocean-text-secondary">Published</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-warning/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-ocean-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ocean-navy">{upcomingCount}</p>
                      <p className="text-sm text-ocean-text-secondary">Upcoming</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-coral/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-ocean-coral" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ocean-navy">{formatNumber(totalParticipants)}</p>
                      <p className="text-sm text-ocean-text-secondary">Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
              <Input
                placeholder="Search events..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Village</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium text-ocean-navy">{event.title}</TableCell>
                        <TableCell>
                          <Badge className={typeColors[event.type]}>{event.type.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-ocean-text-secondary">{event.date}</TableCell>
                        <TableCell className="text-ocean-text-secondary">{event.village}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-ocean-text-secondary">
                              {event.participants}/{event.maxParticipants}
                            </span>
                            <div className="w-16 h-1.5 bg-ocean-light rounded-full overflow-hidden">
                              <div
                                className="h-full bg-ocean-green rounded-full"
                                style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[event.status]}>{event.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                              <Trash2 className="h-4 w-4 text-ocean-danger" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-ocean-text-secondary">
                          No events found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-ocean-navy">
                  {view === "add" ? "Create New Event" : "Edit Event"}
                </h1>
                <p className="text-ocean-text-secondary">
                  {view === "add" ? "Fill in the details to add a new event." : `Editing: ${selectedEvent?.title}`}
                </p>
              </div>
            </div>
            <CrudForm
              title="Event"
              fields={fields}
              initialData={selectedEvent ?? undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              mode={view === "add" ? "add" : "edit"}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
