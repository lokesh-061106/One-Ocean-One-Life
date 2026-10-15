"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/components/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMenuItems, useSaveMenuItems } from "@/hooks/use-menu-items";
import type { MenuItem, MenuItemGroup } from "@/admin/menu";

const GROUP_LABEL: Record<MenuItemGroup, string> = {
  explore: "Explore",
  community: "Community",
  marketplace: "Marketplace",
  general: "General",
};

const GROUP_BADGE: Record<MenuItemGroup, string> = {
  explore: "bg-ocean-blue/10 text-ocean-blue border-ocean-blue/30",
  community: "bg-ocean-green/10 text-ocean-green border-ocean-green/30",
  marketplace: "bg-ocean-coral/10 text-ocean-coral border-ocean-coral/30",
  general: "bg-ocean-muted/10 text-ocean-text-secondary border-ocean-border",
};

const bySortOrder = (a: MenuItem, b: MenuItem) => a.sortOrder - b.sortOrder;

/** Renumber so the draft order is contiguous (1..n) after any move. */
const renumber = (items: MenuItem[]): MenuItem[] =>
  items.map((item, index) => ({ ...item, sortOrder: index + 1 }));

export default function FrontendMenuPage() {
  const mounted = useHydrated();
  const { user } = useAuth();
  const serverItems = useMenuItems();
  const saveItems = useSaveMenuItems();

  const [draft, setDraft] = React.useState<MenuItem[]>([...serverItems].sort(bySortOrder));
  const [dirty, setDirty] = React.useState(false);
  const [status, setStatus] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);

  /* Adopt server values until the admin starts editing (render-time sync) */
  const [lastServer, setLastServer] = React.useState(serverItems);
  if (!dirty && lastServer !== serverItems) {
    setLastServer(serverItems);
    setDraft([...serverItems].sort(bySortOrder));
  }

  const isAdmin = mounted && !!user && (user.role === "admin" || user.role === "super_admin");

  const toggleVisible = (index: number, checked: boolean) => {
    setDirty(true);
    setStatus(null);
    setDraft((prev) => prev.map((item, i) => (i === index ? { ...item, isVisible: checked } : item)));
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= draft.length) return;
    setDirty(true);
    setStatus(null);
    setDraft((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return renumber(next);
    });
  };

  const handleSave = async () => {
    try {
      const saved = await saveItems.mutateAsync(draft);
      setDraft([...saved].sort(bySortOrder));
      setDirty(false);
      setStatus({ kind: "ok", text: "Saved. The storefront menu is updated for all visitors." });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not save the menu items.",
      });
    }
  };

  if (mounted && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> Restricted
              </CardTitle>
              <CardDescription>
                Only administrators can change the storefront menu.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const visibleCount = draft.filter((item) => item.isVisible).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ocean-navy">Frontend Menu</h1>
            <p className="text-ocean-text-secondary">
              Show or hide storefront menu items and set their order. Applies to every header style,
              the mobile menu and the footer once saved.
            </p>
            <p className="text-xs text-ocean-muted mt-1">
              {visibleCount} of {draft.length} items visible
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <p
                role="status"
                className={cn(
                  "text-sm",
                  status.kind === "ok" ? "text-ocean-green" : "text-ocean-danger"
                )}
              >
                {status.text}
              </p>
            )}
            <Button onClick={handleSave} disabled={!dirty || saveItems.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveItems.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
            <CardDescription>
              Toggle a switch to show or hide an item. Use the arrows to reorder — the top row is
              shown first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="hidden md:table-cell">Link</TableHead>
                  <TableHead className="hidden sm:table-cell">Group</TableHead>
                  <TableHead className="text-right">Visible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.map((item, index) => (
                  <TableRow key={item.key} className={cn(!item.isVisible && "opacity-60")}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="w-6 text-sm text-ocean-muted tabular-nums">
                          {index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={`Move ${item.label} up`}
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={`Move ${item.label} down`}
                          disabled={index === draft.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium text-ocean-navy">
                        {item.label}
                        {item.isAccent && (
                          <Badge variant="outline" className="border-ocean-danger/40 text-ocean-danger">
                            Accent
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-ocean-muted mt-0.5">{item.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs text-ocean-text-secondary">
                      {item.href}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={GROUP_BADGE[item.group]}>
                        {GROUP_LABEL[item.group]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.isVisible ? (
                          <Eye className="h-4 w-4 text-ocean-green" aria-hidden="true" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-ocean-muted" aria-hidden="true" />
                        )}
                        <Switch
                          checked={item.isVisible}
                          onCheckedChange={(checked) => toggleVisible(index, checked)}
                          aria-label={`${item.isVisible ? "Hide" : "Show"} ${item.label}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <p className="text-xs text-ocean-muted">
              Items such as &ldquo;Fisherwomen SHGs&rdquo; and the footer About links are not part of
              this menu and are always shown.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
