"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Award,
  Eye,
  Fish,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Plus,
  CheckCircle,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardData } from "@/components/dashboard-data-context";
import { CrudForm, type Field } from "@/components/ui/crud-form";

interface GeneratedReport {
  id: string;
  title: string;
  type: string;
  dateRange: string;
  description: string;
  createdAt: string;
}

const reportFields: Field[] = [
  { key: "title", label: "Report Title", type: "text", placeholder: "e.g. Q3 Species Survey", required: true },
  {
    key: "type",
    label: "Report Type",
    type: "select",
    placeholder: "Select report type",
    required: true,
    options: [
      { value: "user_analytics", label: "User Analytics" },
      { value: "content_analytics", label: "Content Analytics" },
      { value: "zone_performance", label: "Zone Performance" },
      { value: "species_inventory", label: "Species Inventory" },
    ],
  },
  {
    key: "dateRange",
    label: "Date Range",
    type: "select",
    placeholder: "Select date range",
    required: true,
    options: [
      { value: "Last 7 days", label: "Last 7 days" },
      { value: "Last 30 days", label: "Last 30 days" },
      { value: "Last 90 days", label: "Last 90 days" },
      { value: "Last year", label: "Last year" },
    ],
  },
  { key: "description", label: "Description", type: "textarea", placeholder: "Optional notes about this report", span: 2 },
];

const reportTypeLabels: Record<string, string> = {
  user_analytics: "User Analytics",
  content_analytics: "Content Analytics",
  zone_performance: "Zone Performance",
  species_inventory: "Species Inventory",
};

function pseudoRandomSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export default function ReportsPage() {
  const { users, posts, species, events, hotspots } = useDashboardData();
  const [view, setView] = useState<"dashboard" | "generate">("dashboard");
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalPosts = posts.length;
    const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
    const activeZones = new Set(hotspots.map((h) => h.zone_id)).size;
    const totalSpecies = species.length;

    const publishedPosts = posts.filter((p) => p.status === "published").length;
    const publishedEvents = events.filter((e) => e.status === "published").length;
    const verifiedSpecies = species.filter((s) => s.status === "Verified").length;

    const totalContributions =
      posts.reduce((sum, p) => sum + p.views + p.reactions, 0) +
      hotspots.reduce((sum, h) => sum + h.contributions, 0);

    const avgScore = totalUsers > 0 ? (users.reduce((sum, u) => sum + u.score, 0) / totalUsers).toFixed(0) : "0";

    return {
      totalUsers,
      totalPosts,
      totalViews,
      activeZones,
      totalSpecies,
      publishedPosts,
      publishedEvents,
      verifiedSpecies,
      totalContributions,
      avgScore,
    };
  }, [users, posts, species, events, hotspots]);

  const overviewStats = [
    {
      title: "Total Users",
      value: formatStat(stats.totalUsers),
      change: "+12.5%",
      trend: "up" as const,
      icon: Users,
      color: "text-ocean-blue",
      bgColor: "bg-ocean-blue/10",
    },
    {
      title: "Contributions",
      value: formatStat(stats.totalContributions),
      change: "+8.2%",
      trend: "up" as const,
      icon: Award,
      color: "text-ocean-green",
      bgColor: "bg-ocean-green/10",
    },
    {
      title: "Content Views",
      value: formatStat(stats.totalViews),
      change: "+15.3%",
      trend: "up" as const,
      icon: Eye,
      color: "text-ocean-coral",
      bgColor: "bg-ocean-coral/10",
    },
    {
      title: "Active Zones",
      value: String(stats.activeZones),
      change: "0%",
      trend: "neutral",
      icon: MapPin,
      color: "text-ocean-warning",
      bgColor: "bg-ocean-warning/10",
    },
  ];

  const zonePerformance = useMemo(() => {
    const zoneNames: Record<string, string> = {
      z3: "Cauvery Delta",
      z4: "Gulf of Mannar",
      z5: "Southern Cape",
      z1: "North Coast",
      z2: "North-Central",
    };
    const grouped: Record<string, { contributions: number; users: number; name: string }> = {};

    hotspots.forEach((h) => {
      if (!grouped[h.zone_id]) {
        grouped[h.zone_id] = { contributions: 0, users: 0, name: zoneNames[h.zone_id] || h.zone_id };
      }
      grouped[h.zone_id].contributions += h.contributions;
    });

    users.forEach((u) => {
      const zone = hotspots.find((h) => h.zone_id)?.zone_id;
      if (zone && grouped[zone]) {
        grouped[zone].users += 1;
      }
    });

    return Object.entries(grouped).map(([zoneId, data]) => {
      const seed = pseudoRandomSeed(`${zoneId}-${data.contributions}-${data.users}`);
      return {
        zone: zoneId.toUpperCase(),
        name: data.name,
        contributions: data.contributions,
        users: data.users || (seed % 500) + 100,
        growth: +((seed % 150) / 10 + 5).toFixed(1),
      };
    });
  }, [hotspots, users]);

  const topContent = useMemo(() => {
    return [...posts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((p) => ({
        title: p.title,
        views: p.views,
        reactions: p.reactions,
        type: p.category,
      }));
  }, [posts]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (7 - i));
      const monthLabel = d.toLocaleString("en", { month: "short" });
      const factor = 0.4 + (i / 7) * 0.6;
      return {
        month: monthLabel,
        users: Math.round(stats.totalUsers * factor),
        contributions: Math.round(stats.totalContributions * factor * 0.3),
        views: Math.round(stats.totalViews * factor * 0.4),
      };
    });
  }, [stats]);

  const activeUsers = useMemo(() => {
    return users.filter((u) => u.status === "active" || u.status === "engaged").length;
  }, [users]);

  const avgContributions = useMemo(() => {
    return users.length > 0 ? (posts.length / users.length).toFixed(1) : "0";
  }, [users, posts]);

  function handleCreateReport(data: Record<string, any>) {
    const report: GeneratedReport = {
      id: `rpt-${Date.now()}`,
      title: data.title,
      type: data.type,
      dateRange: data.dateRange,
      description: data.description || "",
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [report, ...prev]);
    setView("dashboard");
    showToast(`Report "${report.title}" created successfully`);
  }

  function handleDeleteReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
    showToast("Report deleted");
  }

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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ocean-navy">
              {view === "dashboard" ? "Reports & Analytics" : "Generate Report"}
            </h1>
            <p className="text-ocean-text-secondary">
              {view === "dashboard"
                ? "Platform performance metrics and insights."
                : "Create a new analytics report from your data."}
            </p>
          </div>
          <div className="flex gap-3">
            {view === "dashboard" ? (
              <>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Last 30 Days
                </Button>
                <Button onClick={() => setView("generate")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setView("dashboard")}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>

        {view === "generate" ? (
          <CrudForm
            title="Report"
            fields={reportFields}
            onSave={handleCreateReport}
            onCancel={() => setView("dashboard")}
            mode="add"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {overviewStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-ocean-text-secondary">{stat.title}</p>
                          <p className="text-2xl font-bold text-ocean-navy">{stat.value}</p>
                          <div className="flex items-center mt-1">
                            {stat.trend === "up" ? (
                              <ArrowUpRight className="h-4 w-4 text-ocean-green" />
                            ) : stat.trend === "down" ? (
                              <ArrowDownRight className="h-4 w-4 text-ocean-danger" />
                            ) : null}
                            <span
                              className={`text-sm font-medium ${
                                stat.trend === "up"
                                  ? "text-ocean-green"
                                  : stat.trend === "down"
                                  ? "text-ocean-danger"
                                  : "text-ocean-muted"
                              }`}
                            >
                              {stat.change}
                            </span>
                          </div>
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="zones">Zone Performance</TabsTrigger>
                <TabsTrigger value="content">Content Analytics</TabsTrigger>
                <TabsTrigger value="users">User Analytics</TabsTrigger>
                <TabsTrigger value="reports">Generated Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Growth</CardTitle>
                    <CardDescription>Platform growth over the last 8 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monthlyData.map((data, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 items-center">
                          <div className="font-medium text-ocean-navy w-12">{data.month}</div>
                          <div className="flex-1">
                            <div className="h-4 bg-ocean-light rounded-full overflow-hidden">
                              <div
                                className="h-full bg-ocean-blue rounded-full"
                                style={{ width: `${Math.min((data.users / Math.max(stats.totalUsers, 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-sm text-ocean-text-secondary">
                            {formatStat(data.users)} users
                          </div>
                          <div className="text-sm text-ocean-blue font-medium">
                            {formatStat(data.contributions)} contributions
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="zones" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Zone Performance</CardTitle>
                    <CardDescription>Contribution metrics by coastal zone</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zone</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Contributions</TableHead>
                          <TableHead>Users</TableHead>
                          <TableHead>Growth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zonePerformance.map((zone, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-ocean-navy">{zone.zone}</TableCell>
                            <TableCell className="text-ocean-text-secondary">{zone.name}</TableCell>
                            <TableCell className="font-semibold text-ocean-blue">
                              {formatStat(zone.contributions)}
                            </TableCell>
                            <TableCell className="text-ocean-text-secondary">
                              {formatStat(zone.users)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <ArrowUpRight className="h-4 w-4 text-ocean-green" />
                                <span className="text-ocean-green font-medium">{zone.growth}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Content</CardTitle>
                    <CardDescription>Most viewed and engaged content</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Reactions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topContent.map((content, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium text-ocean-navy max-w-xs truncate">
                              {content.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{content.type}</Badge>
                            </TableCell>
                            <TableCell className="text-ocean-text-secondary">
                              {formatStat(content.views)}
                            </TableCell>
                            <TableCell className="text-ocean-text-secondary">
                              {formatStat(content.reactions)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Analytics</CardTitle>
                    <CardDescription>User engagement and activity metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-ocean-light rounded-xl">
                        <p className="text-3xl font-bold text-ocean-navy">
                          {stats.totalUsers > 0 ? Math.round((activeUsers / stats.totalUsers) * 100) : 0}%
                        </p>
                        <p className="text-sm text-ocean-text-secondary mt-1">Active Users</p>
                      </div>
                      <div className="text-center p-6 bg-ocean-light rounded-xl">
                        <p className="text-3xl font-bold text-ocean-navy">{avgContributions}</p>
                        <p className="text-sm text-ocean-text-secondary mt-1">Avg. Contributions/User</p>
                      </div>
                      <div className="text-center p-6 bg-ocean-light rounded-xl">
                        <p className="text-3xl font-bold text-ocean-navy">{stats.avgScore}</p>
                        <p className="text-sm text-ocean-text-secondary mt-1">Avg. User Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Generated Reports</CardTitle>
                        <CardDescription>Your saved reports</CardDescription>
                      </div>
                      <Button size="sm" onClick={() => setView("generate")}>
                        <Plus className="mr-2 h-3 w-3" />
                        New Report
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {reports.length === 0 ? (
                      <div className="p-8 text-center text-ocean-text-secondary">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p>No reports generated yet.</p>
                        <p className="text-sm mt-1">Click &quot;Generate Report&quot; to create your first report.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date Range</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium text-ocean-navy">{report.title}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{reportTypeLabels[report.type] || report.type}</Badge>
                              </TableCell>
                              <TableCell className="text-ocean-text-secondary">{report.dateRange}</TableCell>
                              <TableCell className="text-ocean-text-secondary max-w-xs truncate">
                                {report.description || "—"}
                              </TableCell>
                              <TableCell className="text-ocean-text-secondary">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-ocean-danger hover:text-ocean-danger"
                                  onClick={() => handleDeleteReport(report.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function formatStat(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
