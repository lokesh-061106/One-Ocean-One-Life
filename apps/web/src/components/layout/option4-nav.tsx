"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AlertTriangle, LogOut, Settings, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavData } from "@/components/layout/nav-data";
import { useAuth } from "@/components/auth-context";
import { useHydrated } from "@/hooks/use-hydrated";

/* ============================================================ */
/*  Option 4: Vertical Sidebar + minimal header                 */
/*  Rendered by Header; `body.nav-sidebar-4` (lg+) offsets the   */
/*  storefront so nothing is covered.                            */
/* ============================================================ */

export function Option4Sidebar() {
  const pathname = usePathname();
  const mounted = useHydrated();
  const { user, logout } = useAuth();
  const { navGroups, emergencyNavItem } = useNavData();
  const EmergencyIcon = emergencyNavItem?.icon;

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-border/50 bg-white shadow-lg"
      aria-label="Primary sidebar navigation"
    >
      {/* Brand */}
      <div className="border-b border-border/50 px-4 py-4">
        <Link href="/" className="block" aria-label="O3L – One Ocean One Life – Home">
          <span className="relative block h-16 w-full">
            <Image
              src="/o3l-logo.png"
              alt="O3L – One Ocean One Life"
              fill
              sizes="200px"
              className="object-contain"
              priority
            />
          </span>
        </Link>
      </div>

      {/* Main links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => {
          const GroupIcon = group.triggerIcon;
          return (
            <div key={group.label}>
              <h3 className="flex items-center gap-1.5 px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-ocean-muted">
                <GroupIcon className="h-3.5 w-3.5" />
                {group.label}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                        active
                          ? "bg-ocean-light text-ocean-blue"
                          : "text-ocean-text-secondary hover:bg-ocean-light hover:text-ocean-blue"
                      )}
                    >
                      <ItemIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {emergencyNavItem && EmergencyIcon && (
          <div className="border-t border-border/50 pt-3">
            <Link
              href={emergencyNavItem.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                pathname === emergencyNavItem.href || pathname.startsWith(`${emergencyNavItem.href}/`)
                  ? "bg-ocean-danger/10 text-ocean-danger"
                  : "text-ocean-danger hover:bg-ocean-danger/10"
              )}
            >
              <EmergencyIcon className="h-4 w-4 shrink-0" />
              {emergencyNavItem.label}
            </Link>
          </div>
        )}
      </nav>

      {/* Account */}
      <div className="border-t border-border/50 px-3 py-3 space-y-0.5">
        {mounted && user ? (
          <>
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ocean-text-secondary transition-colors hover:bg-ocean-light hover:text-ocean-blue"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ocean-text-secondary transition-colors hover:bg-ocean-light hover:text-ocean-blue"
            >
              <Settings className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-ocean-text-secondary transition-colors hover:bg-ocean-light hover:text-ocean-blue"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ocean-text-secondary transition-colors hover:bg-ocean-light hover:text-ocean-blue"
            >
              <User className="h-4 w-4" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ocean-text-secondary transition-colors hover:bg-ocean-light hover:text-ocean-blue"
            >
              <Users className="h-4 w-4" />
              Join O3L
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
