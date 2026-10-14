"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Recycle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SHG_HOME, SHG_SECTIONS, SHG_TOTAL, sectionIndex } from "@/components/shg/nav";

/* ------------------------------------------------------------------ */
/*  Sub-navigation: Home + 7 programme sections                        */
/* ------------------------------------------------------------------ */

function SubNav({ pathname }: { pathname: string }) {
  const activeIndex = sectionIndex(pathname);
  const isHome = activeIndex === -1;

  return (
    <nav
      aria-label="Fisherwomen SHG programme"
      className="shg-no-print sticky top-[68px] md:top-[76px] lg:top-[84px] z-40 border-b border-ocean-border/70 bg-white/92 backdrop-blur-md"
    >
      <div className="mx-auto max-w-[1440px] px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-3 py-2">
          {/* Programme mark */}
          <Link
            href={SHG_HOME.href}
            className="hidden shrink-0 items-center gap-2 rounded-full bg-shg-forest px-3 py-1.5 text-white transition hover:bg-shg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shg-forest sm:flex"
            aria-label="Waste to Wealth — home"
          >
            <Recycle className="h-4 w-4" aria-hidden="true" />
            <span className="shg-display text-[13px] leading-none tracking-wide">
              WASTE TO WEALTH
            </span>
          </Link>

          {/* Section pills */}
          <div className="shg-scroll-x flex flex-1 items-center gap-1.5">
            <Pill
              href={SHG_HOME.href}
              num="00"
              label="Home"
              icon={SHG_HOME.icon}
              active={isHome}
              tone="text-ocean-blue bg-ocean-light"
            />
            {SHG_SECTIONS.map((section) => (
              <Pill
                key={section.key}
                href={section.href}
                num={section.num}
                label={section.short}
                icon={section.icon}
                active={activeIndex >= 0 && SHG_SECTIONS[activeIndex].key === section.key}
                tone={cn(section.chip)}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Pill({
  href,
  num,
  label,
  icon: Icon,
  active,
  tone,
}: {
  href: string;
  num: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  tone: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] font-semibold transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-blue",
        active
          ? cn("border-transparent shadow-sm", tone)
          : "border-ocean-border/80 bg-white text-ocean-text-secondary hover:border-ocean-blue/40 hover:text-ocean-blue"
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="shg-numeral text-[11px] opacity-70" aria-hidden="true">
        {num}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Pager: previous / page indicator / next / print                    */
/* ------------------------------------------------------------------ */

function Pager({ pathname }: { pathname: string }) {
  const index = sectionIndex(pathname);
  if (index === -1) return null;

  const prev = index > 0 ? SHG_SECTIONS[index - 1] : SHG_HOME;
  const next = index < SHG_TOTAL - 1 ? SHG_SECTIONS[index + 1] : null;
  const current = SHG_SECTIONS[index];

  return (
    <div className="shg-no-print border-b border-ocean-border/60 bg-white/70">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-3 py-2.5 sm:px-4 lg:px-6">
        <Link
          href={prev.href}
          className={cn(
            "group flex min-w-0 items-center gap-1.5 rounded-lg border border-ocean-border bg-white px-2.5 py-1.5 text-xs font-semibold text-ocean-text-secondary transition",
            "hover:border-ocean-blue/50 hover:text-ocean-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-blue"
          )}
        >
          <ChevronLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          <span className="hidden truncate sm:inline">{prev.label}</span>
          <span className="sm:hidden">Prev</span>
        </Link>

        <div className="flex flex-1 items-center justify-center gap-2" aria-live="polite">
          <span className="shg-display text-sm text-ocean-navy tabular-nums">
            {current.num} <span className="text-ocean-muted">/</span> 0{SHG_TOTAL}
          </span>
          <div
            className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-ocean-light sm:block"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={SHG_TOTAL}
            aria-valuenow={index + 1}
            aria-label={`Section ${index + 1} of ${SHG_TOTAL}`}
          >
            <div
              className={cn("h-full rounded-full transition-all duration-500", current.bar)}
              style={{ width: `${((index + 1) / SHG_TOTAL) * 100}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="hidden rounded-lg border border-ocean-border bg-white p-1.5 text-ocean-text-secondary transition hover:border-ocean-blue/50 hover:text-ocean-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-blue sm:block"
          aria-label="Print or save this section as PDF"
          title="Print / Save as PDF"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
        </button>

        {next ? (
          <Link
            href={next.href}
            className={cn(
              "group flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white transition shadow-sm",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-navy",
              next.bar,
              "hover:brightness-110"
            )}
          >
            <span className="hidden truncate sm:inline">{next.label}</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href={SHG_HOME.href}
            className="flex items-center gap-1.5 rounded-lg bg-ocean-navy px-2.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-navy"
          >
            <span className="hidden sm:inline">Back to overview</span>
            <span className="sm:hidden">Home</span>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell                                                              */
/* ------------------------------------------------------------------ */

export function ShgShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <SubNav pathname={pathname} />
      <Pager pathname={pathname} />
      <main className="shg-shell-main" id="main-content">
        <div key={pathname} className="shg-page-in">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
