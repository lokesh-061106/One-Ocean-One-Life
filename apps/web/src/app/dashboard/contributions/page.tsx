"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Search, Plus, Edit, Trash2, CheckCircle, Clock, Star, X, ShieldCheck, Ban, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationDisplay } from "@/components/location-display";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDashboardData, type DashboardContribution } from "@/components/dashboard-data-context";
import { useAuth } from "@/components/auth-context";
import { authFetch } from "@/lib/auth-fetch";
import { ContributionWizard, type ContributionWizardData, type ExistingMediaItem } from "@/components/contributions/contribution-wizard";

const PENDING_STATUSES = new Set(["draft", "submitted", "auto_validated", "moderator_review", "scientific_review"]);

const STATUS_LABELS: Record<string, string> = {
  submitted: "Pending",
  auto_validated: "Pending",
  moderator_review: "Pending",
  scientific_review: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  draft: "Draft",
  duplicate: "Duplicate",
};

const statusColors: Record<string, string> = {
  verified: "bg-ocean-green text-white",
  submitted: "bg-ocean-warning text-white",
  auto_validated: "bg-ocean-warning text-white",
  moderator_review: "bg-ocean-warning text-white",
  scientific_review: "bg-ocean-warning text-white",
  pending: "bg-ocean-warning text-white",
  rejected: "bg-ocean-danger text-white",
  draft: "bg-ocean-muted text-white",
  duplicate: "bg-ocean-muted text-white",
};

const typeColors: Record<string, string> = {
  observation: "bg-ocean-blue/10 text-ocean-blue",
  marine_sighting: "bg-ocean-blue/10 text-ocean-blue",
  sighting: "bg-ocean-blue/10 text-ocean-blue",
  ocean_sound: "bg-ocean-coral/10 text-ocean-coral",
  sound: "bg-ocean-coral/10 text-ocean-coral",
  fish_catch: "bg-ocean-green/10 text-ocean-green",
  education_post: "bg-ocean-green/10 text-ocean-green",
  education: "bg-ocean-green/10 text-ocean-green",
  local_knowledge: "bg-ocean-warning/10 text-ocean-warning",
  guide: "bg-ocean-warning/10 text-ocean-warning",
  event: "bg-ocean-blue/10 text-ocean-blue",
  beach_cleanup: "bg-ocean-green/10 text-ocean-green",
};

const TYPE_LABELS: Record<string, string> = {
  observation: "Observation",
  marine_sighting: "Sighting",
  ocean_sound: "Sound",
  fish_catch: "Fish Catch",
  education_post: "Education",
  local_knowledge: "Guide",
  event: "Event",
  beach_cleanup: "Beach Cleanup",
};

const CONTRIBUTOR_TYPE_LABELS: Record<string, string> = {
  fisher: "Fisher",
  researcher: "Researcher",
  volunteer: "Volunteer",
  enthusiast: "Enthusiast",
  student: "Student",
  organisation: "Organisation",
};

function mapListRow(c: any): DashboardContribution {
  let latitude: number | null = null;
  let longitude: number | null = null;
  const loc = c.location;
  if (loc && typeof loc === "object" && Array.isArray(loc.coordinates)) {
    longitude = loc.coordinates[0];
    latitude = loc.coordinates[1];
  }
  return {
    id: c.id || "",
    title: c.title || "",
    type: c.type || "",
    author: c.author_display || c.author || c.user_name || "",
    village: c.village_name || "",
    villageId: c.village || "",
    points: c.points || 0,
    status: c.status || "submitted",
    notes: c.notes || "",
    description: c.description || "",
    media: Array.isArray(c.media) ? c.media : [],
    date: c.created_at ? c.created_at.split("T")[0] : "",
    contributorType: c.contributor_type || "",
    latitude,
    longitude,
    metadata: c.metadata || {},
  };
}

async function fetchApiContributions(): Promise<{ items: DashboardContribution[]; error?: string }> {
  try {
    const res = await authFetch("/contributions/my/");
    if (res.status === 401) return { items: [], error: "Session expired. Please log out and log in again." };
    if (!res.ok) return { items: [], error: `Failed to load contributions (${res.status}).` };
    const data = await res.json();
    const items = data.results || data || [];
    return { items: items.map(mapListRow) };
  } catch {
    return { items: [], error: "Cannot reach the server. Check your connection." };
  }
}

async function fetchAdminContributions(): Promise<{ items: DashboardContribution[]; error?: string }> {
  try {
    const res = await authFetch("/contributions/admin/all/");
    if (res.status === 401) return { items: [], error: "Session expired. Please log out and log in again." };
    if (res.status === 403) return { items: [], error: "You do not have permission to review contributions." };
    if (!res.ok) return { items: [], error: `Failed to load review queue (${res.status}).` };
    const data = await res.json();
    const items = data.results || data || [];
    return { items: items.map(mapListRow) };
  } catch {
    return { items: [], error: "Cannot reach the server. Check your connection." };
  }
}

function isPending(status: string) {
  return PENDING_STATUSES.has(status);
}

export default function ContributionsPage() {
  const { user } = useAuth();
  const { deleteContribution, reviewContribution, addContribution, updateContribution } = useDashboardData();
  const [contributions, setContributions] = useState<DashboardContribution[]>([]);
  const [adminQueue, setAdminQueue] = useState<DashboardContribution[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [selectedItem, setSelectedItem] = useState<DashboardContribution | null>(null);
  const [tab, setTab] = useState<"mine" | "review">("mine");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DashboardContribution | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const role = (user?.role || "").toLowerCase();
  const isReviewer = !!user?.isSuperuser || ["admin", "super_admin", "moderator", "scientific_validator"].includes(role);

  const refresh = useCallback(async () => {
    const { items: mine, error } = await fetchApiContributions();
    setContributions(mine);
    setListError(error || null);
    if (isReviewer) {
      const { items: queue, error: adminErr } = await fetchAdminContributions();
      setAdminQueue(queue);
      if (adminErr && !error) setListError(adminErr);
    }
  }, [isReviewer]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { items: mine, error } = await fetchApiContributions();
      if (cancelled) return;
      setContributions(mine);
      setListError(error || null);
      if (isReviewer) {
        const { items: queue, error: adminErr } = await fetchAdminContributions();
        if (!cancelled) {
          setAdminQueue(queue);
          if (adminErr && !error) setListError(adminErr);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReviewer]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" = "success") => setToast({ message, type });

  const source = tab === "review" && isReviewer ? adminQueue : contributions;
  const filtered = source.filter(
    c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.author.toLowerCase().includes(searchQuery.toLowerCase()) || c.type.toLowerCase().includes(searchQuery.toLowerCase()) || c.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: contributions.length,
    verified: contributions.filter(c => c.status === "verified").length,
    pending: contributions.filter(c => isPending(c.status)).length,
    totalPoints: contributions.reduce((sum, c) => sum + (c.points || 0), 0),
  };

  const pendingReviewCount = useMemo(() => adminQueue.filter(c => isPending(c.status)).length, [adminQueue]);

  const handleOpenAdd = () => { setSelectedItem(null); setView("add"); };
  const handleOpenEdit = (item: DashboardContribution) => { setSelectedItem(item); setView("edit"); };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this contribution?")) return;
    try {
      await deleteContribution(id);
      showToast("Contribution deleted successfully");
      await refresh();
    } catch (err: any) { showToast(err.message || "Failed to delete", "error"); }
  };

  const doSave = async (data: ContributionWizardData) => {
    try {
      if (view === "add") {
        await addContribution({
          title: data.title,
          type: data.type,
          author: data.author,
          village: data.village,
          villageId: data.village,
          notes: data.notes,
          description: data.description,
          points: data.points,
          images: data.images,
          video: data.video,
          audio: data.audio,
          documents: data.documents,
          locationPhoto: data.locationPhoto,
          setupImages: data.setupImages,
          speciesImages: data.speciesImages,
          voiceNote: data.voiceNote,
          spectrogram: data.spectrogram,
          latitude: data.latitude,
          longitude: data.longitude,
          contributorType: data.contributorType,
          metadata: data.metadata,
          draft: data.draft,
          submit: data.submit,
          status: data.draft ? "draft" : "submitted",
          date: new Date().toISOString().split("T")[0],
        } as any);
        showToast(data.draft ? "Draft saved" : "Contribution submitted for review");
      } else if (selectedItem) {
        await updateContribution(selectedItem.id, {
          title: data.title,
          type: data.type,
          author: data.author,
          village: data.village,
          villageId: data.village,
          notes: data.notes,
          description: data.description,
          images: data.images,
          video: data.video,
          audio: data.audio,
          documents: data.documents,
          locationPhoto: data.locationPhoto,
          setupImages: data.setupImages,
          speciesImages: data.speciesImages,
          voiceNote: data.voiceNote,
          spectrogram: data.spectrogram,
          latitude: data.latitude,
          longitude: data.longitude,
          contributorType: data.contributorType,
          metadata: data.metadata,
          submit: data.submit,
          removeMediaIds: data.removeMediaIds,
        } as any);
        showToast(data.draft ? "Draft saved" : "Contribution updated successfully");
      }
      await refresh();
      setView("list");
      setSelectedItem(null);
    } catch (err: any) {
      showToast(err.message || "Failed to save", "error");
    }
  };

  const handleApprove = async (item: DashboardContribution) => {
    if (!window.confirm(`Approve "${item.title}"? It will become public.`)) return;
    try {
      await reviewContribution(item.id, "approve");
      showToast("Contribution approved and published");
      await refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to approve", "error");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await reviewContribution(rejectTarget.id, "reject", { rejection_reason: rejectReason });
      showToast("Contribution rejected");
      setRejectTarget(null);
      setRejectReason("");
      await refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to reject", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all ${toast.type === "success" ? "bg-ocean-green" : "bg-ocean-danger"}`}>
            <CheckCircle className="h-4 w-4" />{toast.message}
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75"><X className="h-3 w-3" /></button>
          </div>
        )}

        {listError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-ocean-danger/10 text-ocean-danger text-sm border border-ocean-danger/30">
            <X className="h-4 w-4 shrink-0" />
            {listError}
          </div>
        )}

        {view === "list" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ocean-navy">Contribution Management</h1>
                <p className="text-ocean-text-secondary">Submit contributions and review community submissions.</p>
              </div>
              <Button onClick={handleOpenAdd}><Plus className="mr-2 h-4 w-4" />Add Contribution</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center"><Award className="h-5 w-5 text-ocean-blue" /></div><div><p className="text-2xl font-bold text-ocean-navy">{stats.total}</p><p className="text-sm text-ocean-text-secondary">Total</p></div></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-green/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-ocean-green" /></div><div><p className="text-2xl font-bold text-ocean-navy">{stats.verified}</p><p className="text-sm text-ocean-text-secondary">Verified</p></div></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-ocean-warning" /></div><div><p className="text-2xl font-bold text-ocean-navy">{stats.pending}</p><p className="text-sm text-ocean-text-secondary">Pending</p></div></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-coral/10 flex items-center justify-center"><Star className="h-5 w-5 text-ocean-coral" /></div><div><p className="text-2xl font-bold text-ocean-navy">{stats.totalPoints}</p><p className="text-sm text-ocean-text-secondary">Points</p></div></div></CardContent></Card>
            </div>

            {isReviewer && (
              <div className="flex items-center gap-2">
                <Button variant={tab === "mine" ? "default" : "outline"} size="sm" onClick={() => setTab("mine")}>
                  My Contributions
                </Button>
                <Button variant={tab === "review" ? "default" : "outline"} size="sm" onClick={() => setTab("review")}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" />
                  Pending Review ({pendingReviewCount})
                </Button>
              </div>
            )}

            <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" /><Input placeholder="Search contributions..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contributor</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-ocean-blue flex items-center justify-center text-white text-sm font-medium">{(c.author || "?").charAt(0)}</div>
                            <div>
                              <div className="font-medium text-ocean-navy">{c.author}</div>
                              <LocationDisplay name={c.village} showCoords={false} size="sm" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-ocean-navy max-w-xs truncate">
                          {c.title || <span className="text-ocean-muted italic">(no title)</span>}
                        </TableCell>
                        <TableCell><Badge className={typeColors[c.type] || ""}>{TYPE_LABELS[c.type] || c.type}</Badge></TableCell>
                        <TableCell>
                          {c.contributorType
                            ? <Badge variant="outline" className="text-ocean-text-secondary">{CONTRIBUTOR_TYPE_LABELS[c.contributorType] || c.contributorType}</Badge>
                            : <span className="text-ocean-muted">—</span>}
                        </TableCell>
                        <TableCell><Badge className={statusColors[c.status] || ""}>{STATUS_LABELS[c.status] || c.status}</Badge></TableCell>
                        <TableCell className="font-semibold text-ocean-blue">{c.points > 0 ? `+${c.points}` : "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {tab === "review" && isReviewer && isPending(c.status) && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(c)}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-ocean-green" />Approve & Publish
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setRejectTarget(c); setRejectReason(""); }}>
                                    <Ban className="mr-2 h-4 w-4 text-ocean-danger" />Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {tab === "mine" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleOpenEdit(c)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem className="text-ocean-danger" onClick={() => handleDelete(c.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-ocean-text-secondary">
                        {tab === "review" ? "No contributions awaiting review." : "No contributions found."}
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {(view === "add" || view === "edit") && (
          <ContributionWizard
            mode={view === "add" ? "add" : "edit"}
            isAdmin={isReviewer}
            defaultAuthor={user ? `${user.firstName} ${user.lastName}`.trim() || user.email : ""}
            initialData={
              view === "edit" && selectedItem
                ? {
                    title: selectedItem.title,
                    type: selectedItem.type,
                    author: selectedItem.author,
                    village: selectedItem.villageId || "",
                    notes: selectedItem.notes,
                    description: selectedItem.description || "",
                    contributorType: selectedItem.contributorType || "",
                    latitude: selectedItem.latitude,
                    longitude: selectedItem.longitude,
                    metadata: Object.fromEntries(
                      Object.entries(selectedItem.metadata || {})
                        .filter(([, v]) => v != null && v !== "")
                        .map(([k, v]) => [k, typeof v === "boolean" ? (v ? "true" : "false") : String(v)]),
                    ),
                    points: selectedItem.points,
                    existingMedia: selectedItem.media?.map((m): ExistingMediaItem => ({
                      id: m.id,
                      kind: m.kind,
                      url: m.url,
                      display_name: m.display_name,
                      role: (m as any).role,
                    })),
                  }
                : undefined
            }
            onSave={doSave}
            onCancel={() => { setView("list"); setSelectedItem(null); }}
          />
        )}

        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-lg text-ocean-navy">Reject Contribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-ocean-text-secondary line-clamp-2">{rejectTarget.title}</p>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-ocean-border p-2 text-sm"
                  placeholder="Rejection reason (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
                  <Button className="bg-ocean-danger text-white" onClick={handleReject}>
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
