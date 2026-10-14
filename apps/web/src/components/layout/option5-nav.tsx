"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/* ============================================================ */
/*  Option 5: Document Header (brand panel + action row +       */
/*  section link row, matching the customer-demo document look)  */
/* ============================================================ */

const BRAND_CHIP = "Citizen Science Platform";

interface DocLink {
  label: string;
  href: string;
  accent?: boolean;
}

const docLinks: DocLink[] = [
  { label: "Overview", href: "/" },
  { label: "Guides", href: "/guides" },
  { label: "Education", href: "/education" },
  { label: "Ocean Map", href: "/map" },
  { label: "Ocean Sounds", href: "/sounds" },
  { label: "Sightings", href: "/sightings" },
  { label: "Fish Catch", href: "/catches" },
  { label: "Observations", href: "/observations" },
  { label: "Contributions", href: "/contributions" },
  { label: "Community", href: "/community/members" },
  { label: "Events", href: "/events" },
  { label: "Clean-ups", href: "/cleanups" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Ecotourism", href: "/ecotourism" },
  { label: "Economy", href: "/economy" },
  { label: "Recognition", href: "/recognition" },
  { label: "Emergency", href: "/emergency", accent: true },
];

function isLinkActive(link: DocLink, pathname: string): boolean {
  if (link.href === "/") return pathname === "/";
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

/* ------------------------------------------------------------------ */
/*  Brand zone: dark gradient panel with the logo card, name and chip  */
/* ------------------------------------------------------------------ */

export function Option5BrandZone() {
  return (
    <Link
      href="/"
      aria-label="O3L – One Ocean One Life – Home"
      className={cn(
        "group relative flex shrink-0 items-center gap-3 border-r border-white/15",
        "bg-gradient-to-br from-ocean-navy via-ocean-deep to-ocean-blue text-white",
        "px-4 py-2 sm:gap-4 sm:px-5 lg:px-7 lg:py-2.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
      )}
    >
      <span
        className={cn(
          "relative block h-[56px] w-[84px] shrink-0 rounded-xl bg-white p-1 shadow-[0_8px_24px_rgba(3,20,35,0.4)]",
          "transition-transform duration-200 group-hover:scale-[1.03]",
          "sm:h-[68px] sm:w-[102px] sm:rounded-2xl sm:p-1.5",
          "lg:h-[150px] lg:w-[225px] lg:rounded-2xl lg:p-1.5"
        )}
      >
        <Image
          src="/o3l-logo.png"
          alt="O3L - One Ocean One Life"
          fill
          sizes="(min-width: 1024px) 225px, 102px"
          className="object-contain"
          priority
        />
      </span>

      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-[1.15rem] font-bold leading-none tracking-tight sm:text-[1.35rem] lg:text-[2.1rem]">
          O3L
        </span>
        <span className="hidden text-[0.62rem] font-semibold uppercase leading-none tracking-[0.1em] text-[#A5DCF3] sm:inline lg:text-[0.8rem] lg:tracking-[0.16em]">
          One Ocean One Life
        </span>
        <span
          className={cn(
            "mt-1 hidden w-fit rounded-full bg-white/95 px-3 py-1.5 text-[0.6rem] font-extrabold uppercase",
            "tracking-[0.13em] text-ocean-navy lg:inline-block"
          )}
        >
          {BRAND_CHIP}
        </span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav row: flat section links below the action row (desktop only)   */
/* ------------------------------------------------------------------ */

export function Option5NavRow() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "hidden w-full flex-wrap items-center gap-x-2 gap-y-1 px-4 pb-3 pt-1 lg:flex lg:px-6"
      )}
    >
      {docLinks.map((link) => {
        const active = isLinkActive(link, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-[0.77rem] font-semibold leading-none transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue focus-visible:ring-offset-1",
              link.accent
                ? active
                  ? "bg-ocean-danger/10 text-ocean-danger"
                  : "text-ocean-danger/80 hover:bg-ocean-danger/10 hover:text-ocean-danger"
                : active
                  ? "bg-ocean-light text-ocean-blue"
                  : "text-ocean-text-secondary hover:bg-ocean-light hover:text-ocean-blue"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
