"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, ShieldCheck, Ban, X, Eye, Search, RefreshCw, Bird, Volume2, GraduationCap, BookOpen, ClipboardList, Fish } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardData } from "@/components/dashboard-data-context";
import { useAuth } from "@/components/auth-context";
import { authFetch } from "@/lib/auth-fetch";
import { useHydrated } from "@/hooks/use-hydrated";

const REVIEWER_ROLES = ["admin", "super_admin", "moderator", "scientific_validator"];

type ModuleKey = "sighting" | "sound" | "fish_catch" | "education" | "guide" | "other";

interface QueueItem {
  id: string;
  title: string;
  type: string;
  status: string;
  author: string;
  village: string;
  notes: string;
  safety_status: string;
  submitted_at: string | null;
  created_at: string;
  media: { id: string; kind: string; url: string; display_name?: string }[];
}

const MODULE_TABS: { key: ModuleKey; label: string; icon: typeof Bird; modulePath: string; moduleName: string; types: string[] }[] = [
  { key: "sighting", label: "Sightings", icon: Bird, modulePath: "/sightings", moduleName: "Sightings", types: ["marine_sighting"] },
  { key: "sound", label: "Sounds", icon: Volume2, modulePath: "/sounds", moduleName: "Sounds", types: ["ocean_sound"] },
  { key: "fish_catch", label: "Fish Catch", icon: Fish, modulePath: "/contributions", moduleName: "Fish Catch", types: ["fish_catch"] },
  { key: "education", label: "Education", icon: GraduationCap, modulePath: "/education", moduleName: "Education", types: ["education_post"] },
  { key: "guide", label: "Guides", icon: BookOpen, modulePath: "/guides", moduleName: "Species Guides", types: ["local_knowledge"] },
  { key: "other", label: "Other", icon: ClipboardList, modulePath: "/contributions", moduleName: "Public Contributions", types: ["observation", "event", "beach_cleanup"] },
];

const TYPE_LABELS: Record<string, string> = {
  marine_sighting: "Sighting",
  ocean_sound: "Sound",
  fish_catch: "Fish Catch",
  education_post: "Education",
  local_knowledge: "Guide",
  observation: "Observation",
  event: "Event",
  beach_cleanup: "Beach Cleanup",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Pending",
  auto_validated: "Pending",
  moderator_review: "Pending",
  scientific_review: "Pending",
};

function moduleForType(type: string) {
  return MODULE_TABS.find(t => t.types.includes(type)) || MODULE_TABS[MODULE_TABS.length - 1];
}

async function fetchPendingQueue(): Promise<{ items: QueueItem[]; error?: string }> {
  try {
    const res = await authFetch("/contributions/admin/all/?pending=1&ordering=-created_at&page_size=100");
    if (res.status === 401) return { items: [], error: "Session expired. Please log out and log in again." };
    if (res.status === 403) return { items: [], error: "You do not have permission to review contributions." };
    if (!res.ok) return { items: [], error: `Failed to load queue (${res.status}).` };
    const data = await res.json();
    const rows = data.results || data || [];
    return {
      items: rows.map((c: any) => ({
        id: c.id || "",
        title: c.title || c.notes || TYPE_LABELS[c.type] || `Contribution ${String(c.id || "").slice(0, 8)}`,
        type: c.type || "",
        status: c.status || "submitted",
        author: c.author_display || c.author || c.user_name || "",
        village: c.village_name || "",
        notes: c.notes || "",
        safety_status: c.safety_status || "",
        submitted_at: c.submitted_at || null,
        created_at: c.created_at || "",
        media: Array.isArray(c.media) ? c.media : [],
      })),
    };
  } catch {
    return { items: [], error: "Cannot reach the server." };
  }
}

export default function PendingReviewsPage() {
  const { user } = useAuth();
  const { reviewContribution } = useDashboardData();
  const mounted = useHydrated();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModuleKey | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<QueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const role = (user?.role || "").toLowerCase();
  const isReviewer = !!user?.isSuperuser || REVIEWER_ROLES.includes(role);

  const refresh = useCallback(async () => {
    const { items: rows, error: err } = await fetchPendingQueue();
    setItems(rows);
    setError(err || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isReviewer) return;
    let cancelled = false;
    (async () => {
      const { items: rows, error: err } = await fetchPendingQueue();
      if (cancelled) return;
      setItems(rows);
      setError(err || null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isReviewer]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const tab of MODULE_TABS) c[tab.key] = items.filter(i => tab.types.includes(i.type)).length;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    let rows = items;
    if (activeTab !== "all") rows = rows.filter(i => moduleForType(i.type).key === activeTab);
    const q = searchQuery.toLowerCase();
    if (q) rows = rows.filter(i =>
      i.title.toLowerCase().includes(q) || i.author.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q) || i.village.toLowerCase().includes(q)
    );
    return rows;
  }, [items, activeTab, searchQuery]);

  const handleApprove = async (item: QueueItem) => {
    const mod = moduleForType(item.type);
    if (!window.confirm(`Approve "${item.title}"?\n\nIt will be published to the ${mod.moduleName} module.`)) return;
    setBusyId(item.id);
    try {
      await reviewContribution(item.id, "approve");
      showToast(`Approved — published to ${mod.moduleName}`);
      await refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to approve", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await reviewContribution(rejectTarget.id, "reject", { rejection_reason: rejectReason });
      showToast("Contribution rejected");
      setRejectTarget(null);
      setRejectReason("");
      await refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to reject", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card><CardContent className="p-10 text-center text-ocean-text-secondary">Loading...</CardContent></Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!isReviewer) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <ShieldCheck className="mx-auto h-10 w-10 text-ocean-muted" />
              <h1 className="text-xl font-bold text-ocean-navy">Access Restricted</h1>
              <p className="text-ocean-text-secondary">Pending Reviews is available to admins and moderators only.</p>
              <Button variant="outline" asChild><Link href="/dashboard/contributions">Go to My Contributions</Link></Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all ${toast.type === "success" ? "bg-ocean-green" : "bg-ocean-danger"}`}>
            <CheckCircle className="h-4 w-4" />{toast.message}
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75"><X className="h-3 w-3" /></button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ocean-navy">Pending Reviews</h1>
            <p className="text-ocean-text-secondary">Approve or reject community contributions. Approved items publish to their module.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); refresh(); }} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {MODULE_TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${active ? "border-ocean-blue bg-ocean-blue/5" : "border-ocean-border hover:bg-ocean-muted/30"}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? "bg-ocean-blue text-white" : "bg-ocean-muted/40 text-ocean-text-secondary"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active ? "text-ocean-blue" : "text-ocean-navy"}`}>{tab.label}</p>
                  <p className="text-xs text-ocean-text-secondary">{counts[tab.key] || 0} pending</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={activeTab === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("all")}>
            <ClipboardList className="mr-1.5 h-4 w-4" />All ({counts.all || 0})
          </Button>
          <div className="relative max-w-xs flex-1 min-w-[200px] ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
            <Input placeholder="Search title, contributor, village..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {error && (
          <Card><CardContent className="p-6 text-center text-ocean-danger">{error}</CardContent></Card>
        )}

        {!error && loading && (
          <Card><CardContent className="p-10 text-center text-ocean-text-secondary">Loading pending contributions...</CardContent></Card>
        )}

        {!error && !loading && filtered.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center space-y-2">
              <CheckCircle className="mx-auto h-10 w-10 text-ocean-green" />
              <p className="font-medium text-ocean-navy">All clear — nothing to review here.</p>
              <p className="text-sm text-ocean-text-secondary">New submissions from the community will appear in this queue.</p>
            </CardContent>
          </Card>
        )}

        {!error && !loading && filtered.map(item => {
          const mod = moduleForType(item.type);
          const ModIcon = mod.icon;
          const thumb = item.media.find(m => m.kind === "image");
          const busy = busyId === item.id;
          return (
            <Card key={item.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {thumb ? (
                    <img src={thumb.url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-ocean-muted/40 flex items-center justify-center flex-shrink-0">
                      <ModIcon className="h-7 w-7 text-ocean-text-secondary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ocean-navy truncate">{item.title}</p>
                      <Badge className="bg-ocean-blue/10 text-ocean-blue">{TYPE_LABELS[item.type] || item.type}</Badge>
                      <Badge className="bg-ocean-warning text-white">{STATUS_LABELS[item.status] || item.status}</Badge>
                      {item.safety_status && item.safety_status !== "SAFE" && (
                        <Badge className="bg-ocean-danger text-white">{item.safety_status}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-ocean-text-secondary truncate">
                      by {item.author}{item.village ? ` — ${item.village}` : ""}
                      {item.submitted_at ? ` · ${new Date(item.submitted_at).toLocaleDateString()}` : item.created_at ? ` · ${new Date(item.created_at).toLocaleDateString()}` : ""}
                    </p>
                    {item.notes && <p className="text-sm text-ocean-text-secondary truncate italic">{item.notes}</p>}
                    <p className="text-xs text-ocean-muted mt-0.5">
                      Approving publishes to{" "}
                      <Link href={mod.modulePath} className="text-ocean-blue hover:underline font-medium">{mod.moduleName}</Link>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" className="bg-ocean-green text-white" disabled={busy} onClick={() => handleApprove(item)}>
                    <CheckCircle className="mr-1.5 h-4 w-4" />Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-ocean-danger border-ocean-danger/40 hover:bg-ocean-danger/10" disabled={busy} onClick={() => { setRejectTarget(item); setRejectReason(""); }}>
                    <Ban className="mr-1.5 h-4 w-4" />Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-ocean-navy">Reject Contribution</h2>
                <p className="text-sm text-ocean-text-secondary line-clamp-2">{rejectTarget.title}</p>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-ocean-border p-2 text-sm"
                  placeholder="Rejection reason (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
                  <Button className="bg-ocean-danger text-white" disabled={busyId === rejectTarget.id} onClick={handleReject}>
                    <Ban className="mr-1.5 h-4 w-4" />Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
