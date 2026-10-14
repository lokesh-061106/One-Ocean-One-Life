"use client";

import * as React from "react";
import { Check, Lock, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";
import { useHeaderMenuConfig, useSaveHeaderMenu } from "@/hooks/use-header-menu";
import {
  FLAG_BY_OPTION,
  MENU_OPTIONS,
  type HeaderMenuConfig,
  type MenuOption,
} from "@/admin/config";

/* ------------------------------------------------------------------ */
/*  Wireframe preview for each menu style                              */
/* ------------------------------------------------------------------ */

function MenuPreview({ option, active }: { option: MenuOption; active: boolean }) {
  const bar = "rounded-sm bg-ocean-blue/60";
  const box = (extra: string) => cn("rounded-sm bg-ocean-border", extra);

  return (
    <div className="w-full h-14 rounded-lg border border-ocean-border bg-ocean-foam overflow-hidden p-2 flex gap-2">
      {option === "option1" && (
        <>
          <div className={cn(box("w-5 h-full shrink-0"), active && "bg-ocean-blue/40")} />
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="flex justify-center gap-1">
              <div className={box("w-6 h-1.5")} />
              <div className={box("w-6 h-1.5")} />
              <div className={box("w-6 h-1.5")} />
            </div>
            <div className={cn(box("h-2 w-3/4 mx-auto"), active && "bg-ocean-blue/50")} />
          </div>
        </>
      )}
      {option === "option2" && (
        <>
          <div className={cn(box("w-5 h-full shrink-0"), active && "bg-ocean-blue/40")} />
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            <div className="flex gap-1">
              <div className={cn(box("h-2 w-8 rounded-full"), active && "bg-ocean-blue/50")} />
              <div className={box("h-2 w-8 rounded-full")} />
              <div className={box("h-2 w-8 rounded-full")} />
            </div>
            <div className="flex gap-1">
              <div className={cn("w-1/2 h-6 rounded bg-white border border-ocean-border p-1 space-y-1", active && "border-ocean-blue")}>
                <div className={box("w-8 h-1")} />
                <div className={box("w-10 h-1")} />
                <div className={box("w-7 h-1")} />
              </div>
              <div className="w-1/2 h-6 rounded bg-white border border-ocean-border/60" />
            </div>
          </div>
        </>
      )}
      {option === "option3" && (
        <>
          <div className={cn(box("w-5 h-full shrink-0"), active && "bg-ocean-blue/40")} />
          <div className="flex-1 flex flex-col justify-between">
            <div className={cn(bar, "w-1/3 h-1.5 opacity-40 self-start mt-0.5")} />
            <div className="flex gap-1 pb-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                  <div className={cn(box("h-1.5 w-full"), active && i === 1 && "bg-ocean-blue/60")} />
                  <div className={cn("h-0.5 w-full rounded-sm", active && i === 1 ? "bg-ocean-blue" : "bg-transparent")} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {option === "option4" && (
        <>
          <div className={cn("w-4 h-full rounded-sm flex flex-col gap-1 p-1", active ? "bg-ocean-blue/30" : "bg-ocean-border")}>
            <div className="w-full h-1 bg-white/80 rounded-sm" />
            <div className="w-full h-1 bg-white/60 rounded-sm" />
            <div className="w-3/4 h-1 bg-white/60 rounded-sm" />
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div className={cn(bar, "w-2/3 h-1.5 opacity-40")} />
            <div className={box("h-5 w-full")} />
          </div>
        </>
      )}
      {option === "option5" && (
        <>
          <div className={cn("w-8 h-full rounded-sm flex flex-col justify-center gap-1 p-1", active ? "bg-ocean-blue/50" : "bg-ocean-navy/70")}>
            <div className="w-5 h-3 rounded-[2px] bg-white/85" />
            <div className="w-full h-1 bg-white/50 rounded-sm" />
          </div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div className="flex justify-end gap-1">
              <div className={box("h-3 w-3 rounded-full")} />
              <div className={box("h-3 w-3 rounded-full")} />
              <div className={box("h-3 w-5 rounded-full")} />
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={cn(box("h-1.5 flex-1"), active && i === 1 && "bg-ocean-blue/60")} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HeaderMenuPage() {
  const mounted = useHydrated();
  const { user } = useAuth();
  const serverConfig = useHeaderMenuConfig();
  const saveMenu = useSaveHeaderMenu();

  const [draft, setDraft] = React.useState<HeaderMenuConfig>(serverConfig);
  const [dirty, setDirty] = React.useState(false);
  const [status, setStatus] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);

  /* Adopt server values until the admin starts editing (render-time sync) */
  const [lastServer, setLastServer] = React.useState(serverConfig);
  if (!dirty && lastServer !== serverConfig) {
    setLastServer(serverConfig);
    setDraft(serverConfig);
  }

  const isAdmin = mounted && !!user && (user.role === "admin" || user.role === "super_admin");

  const update = (patch: Partial<HeaderMenuConfig>) => {
    setDirty(true);
    setStatus(null);
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    try {
      const saved = await saveMenu.mutateAsync(draft);
      setDraft(saved);
      setDirty(false);
      setStatus({ kind: "ok", text: "Saved. The storefront header is updated for all visitors." });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not save the header menu.",
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
                Only administrators can change the storefront header menu.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ocean-navy">Header Menu</h1>
            <p className="text-ocean-text-secondary">
              Choose the navigation style shown on the storefront. Applies to every visitor once saved.
            </p>
            {serverConfig.updatedAt && (
              <p className="text-xs text-ocean-muted mt-1">
                Last updated: {new Date(serverConfig.updatedAt).toLocaleString()}
              </p>
            )}
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
            <Button onClick={handleSave} disabled={!dirty || saveMenu.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMenu.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Navigation Style</CardTitle>
            <CardDescription>
              Select the active style and toggle which options are available as fallbacks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MENU_OPTIONS.map((meta) => {
                const active = draft.selectedMenuOption === meta.key;
                const enabled = draft[FLAG_BY_OPTION[meta.key]] !== false;
                return (
                  <div
                    key={meta.key}
                    className={cn(
                      "relative rounded-xl border p-4 transition-colors",
                      active
                        ? "border-ocean-blue ring-2 ring-ocean-blue/30 bg-ocean-light/40"
                        : "border-ocean-border hover:border-ocean-blue/50"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => update({ selectedMenuOption: meta.key })}
                      className="block w-full text-left focus-visible:outline-none"
                      aria-pressed={active}
                    >
                      <MenuPreview option={meta.key} active={active} />
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-ocean-navy">{meta.label}</h3>
                            {active && (
                              <span className="flex items-center gap-1 text-xs font-medium text-ocean-blue">
                                <Check className="h-3.5 w-3.5" /> Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ocean-muted mt-0.5">{meta.tagline}</p>
                          <p className="text-sm text-ocean-text-secondary mt-1">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                    </button>

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={`enable-${meta.key}`}
                        className="text-sm text-ocean-text-secondary"
                      >
                        Available as fallback
                      </Label>
                      <Switch
                        id={`enable-${meta.key}`}
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          update({ [FLAG_BY_OPTION[meta.key]]: checked } as Partial<HeaderMenuConfig>)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
