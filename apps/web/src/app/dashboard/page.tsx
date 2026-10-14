"use client";

import { useState } from "react";
import {
  Users,
  FileText,
  Award,
  Map,
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Waves,
  Fish,
  Eye,
  Mic,
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
import { formatNumber } from "@/lib/utils";
import { useDashboardData } from "@/components/dashboard-data-context";

const statsCards = [
  {
    title: "Total Users",
    value: "82,421",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    color: "text-ocean-blue",
    bgColor: "bg-ocean-blue/10",
  },
  {
    title: "Observations",
    value: "1,284,320",
    change: "+8.2%",
    trend: "up",
    icon: Eye,
    color: "text-ocean-green",
    bgColor: "bg-ocean-green/10",
  },
  {
    title: "Marine Sightings",
    value: "184,210",
    change: "+15.3%",
    trend: "up",
    icon: Fish,
    color: "text-ocean-coral",
    bgColor: "bg-ocean-coral/10",
  },
  {
    title: "Ocean Sounds",
    value: "93,821",
    change: "+5.7%",
    trend: "up",
    icon: Mic,
    color: "text-ocean-warning",
    bgColor: "bg-ocean-warning/10",
  },
];

const zoneImpact = [
  { zone: "Zone 1", name: "North Coast", score: 82.6, contributions: 24500 },
  { zone: "Zone 2", name: "North-Central", score: 78.3, contributions: 19800 },
  { zone: "Zone 3", name: "Cauvery Delta", score: 85.1, contributions: 31200 },
  { zone: "Zone 4", name: "Gulf of Mannar", score: 71.4, contributions: 16500 },
  { zone: "Zone 5", name: "Southern Cape", score: 68.9, contributions: 14200 },
];

const recentActivity = [
  {
    user: "Arumugam",
    action: "submitted a marine sighting",
    target: "Spinner Dolphin",
    time: "2 minutes ago",
    type: "sighting",
  },
  {
    user: "Lakshmi",
    action: "recorded an ocean sound",
    target: "Coastal Recording #1247",
    time: "15 minutes ago",
    type: "sound",
  },
  {
    user: "Kumar",
    action: "created an education post",
    target: "Traditional Fishing Techniques",
    time: "1 hour ago",
    type: "post",
  },
  {
    user: "Priya",
    action: "joined an event",
    target: "Beach Cleanup Drive",
    time: "2 hours ago",
    type: "event",
  },
  {
    user: "Rajan",
    action: "earned an award",
    target: "Marine Guardian 2026",
    time: "3 hours ago",
    type: "award",
  },
];

const topContributors = [
  { rank: 1, name: "Arumugam", village: "Nagapattinam", score: 1240, contributions: 156 },
  { rank: 2, name: "Lakshmi", village: "Poompuhar", score: 1180, contributions: 142 },
  { rank: 3, name: "Kumar", village: "Ramanathapuram", score: 1050, contributions: 128 },
  { rank: 4, name: "Priya", village: "Chennai", score: 980, contributions: 115 },
  { rank: 5, name: "Rajan", village: "Thoothukudi", score: 920, contributions: 108 },
];

export default function DashboardPage() {
  const { users, posts, events, species, hotspots, loading, refreshAll } = useDashboardData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ocean-navy">Dashboard</h1>
            <p className="text-ocean-text-secondary">
              Welcome back! Here&apos;s what&apos;s happening with O3L.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <Activity className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={() => window.open("/dashboard/reports", "_self")}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-ocean-text-secondary">{stat.title}</p>
                      <p className="text-2xl font-bold text-ocean-navy">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-4 w-4 text-ocean-green" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-ocean-danger" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            stat.trend === "up" ? "text-ocean-green" : "text-ocean-danger"
                          }`}
                        >
                          {stat.change}
                        </span>
                        <span className="text-sm text-ocean-muted ml-1">vs last month</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coastal Impact */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Coastal Zone Impact</CardTitle>
              <CardDescription>Performance scores across Tamil Nadu coastal zones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zoneImpact.map((zone, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-ocean-navy">{zone.name}</span>
                        <span className="text-sm text-ocean-muted ml-2">({zone.zone})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-ocean-text-secondary">
                          {formatNumber(zone.contributions)} contributions
                        </span>
                        <span className="font-semibold text-ocean-blue">{zone.score}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-ocean-light rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ocean-blue to-ocean-green rounded-full transition-all duration-500"
                        style={{ width: `${zone.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-ocean-light flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-ocean-blue">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium text-ocean-navy">{activity.user}</span>{" "}
                        <span className="text-ocean-text-secondary">{activity.action}</span>{" "}
                        <span className="font-medium text-ocean-blue">{activity.target}</span>
                      </p>
                      <p className="text-xs text-ocean-muted flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>Highest scoring community members</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Contributions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topContributors.map((contributor) => (
                    <TableRow key={contributor.rank}>
                      <TableCell>
                        <div className="w-8 h-8 rounded-full bg-ocean-light flex items-center justify-center">
                          <span className="text-sm font-bold text-ocean-blue">
                            {contributor.rank}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-ocean-navy">
                        {contributor.name}
                      </TableCell>
                      <TableCell className="text-ocean-text-secondary">
                        {contributor.village}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-ocean-blue">
                        {contributor.score}
                      </TableCell>
                      <TableCell className="text-right text-ocean-text-secondary">
                        {contributor.contributions}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                  <a href="/dashboard/users">
                    <Users className="h-6 w-6 text-ocean-blue" />
                    <span>Manage Users</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                  <a href="/dashboard/content">
                    <FileText className="h-6 w-6 text-ocean-green" />
                    <span>Manage Content</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                  <a href="/dashboard/contributions">
                    <Award className="h-6 w-6 text-ocean-coral" />
                    <span>Review Contributions</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                  <a href="/dashboard/reports">
                    <TrendingUp className="h-6 w-6 text-ocean-warning" />
                    <span>View Reports</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
