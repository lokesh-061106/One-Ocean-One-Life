import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShgSection } from "@/components/shg/nav";

interface SectionHeaderProps {
  section: ShgSection;
  title: string;
  subtitle?: string;
  /** Top-right "message card", lines render like the reference infographics */
  message?: string[];
  messageIcon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Large numbered band used at the top of every programme page —
 * numeral circle + title + subtitle + corner message card.
 */
export function SectionHeader({
  section,
  title,
  subtitle,
  message,
  messageIcon: MessageIcon,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn("mx-auto max-w-[1440px] px-3 pt-6 sm:px-4 lg:px-6", className)}>
      <div
        className={cn(
          "shg-brush relative overflow-hidden rounded-[1.5rem] bg-gradient-to-r text-white shadow-[0_14px_36px_rgba(11,36,51,0.18)]",
          section.band
        )}
      >
        {/* subtle wave texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25 bg-repeat-x bg-bottom bg-[length:800px_200px]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 200'%3E%3Cpath d='M0,140 C120,100 240,180 400,140 C560,100 680,180 800,140' stroke='white' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M0,170 C120,130 240,210 400,170 C560,130 680,210 800,170' stroke='white' stroke-width='2' fill='none' opacity='0.35'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-6 lg:p-7">
          {/* Numeral */}
          <div className="flex items-center gap-4 lg:shrink-0">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-white/80 bg-white/15 backdrop-blur-sm sm:h-[72px] sm:w-[72px]"
              aria-hidden="true"
            >
              <span className="shg-numeral text-4xl text-white sm:text-[42px]">
                {section.num}
              </span>
            </div>
            <div className="min-w-0 lg:hidden">
              <SectionHeading section={section} title={title} subtitle={subtitle} />
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 lg:block">
            <SectionHeading section={section} title={title} subtitle={subtitle} />
          </div>

          {/* Corner message card */}
          {message && message.length > 0 && (
            <div className="relative flex shrink-0 items-start gap-3 self-start rounded-2xl border border-white/40 bg-shg-cream px-4 py-3 text-shg-ink shadow-md lg:max-w-[280px]">
              {MessageIcon && (
                <MessageIcon className="mt-0.5 h-6 w-6 shrink-0 text-shg-forest" aria-hidden="true" />
              )}
              <div className="text-[13px] font-semibold italic leading-snug sm:text-sm">
                {message.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              <span
                aria-hidden="true"
                className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-white/40 bg-shg-cream"
              />
            </div>
          )}
        </div>

        {children}
      </div>

      {subtitle && (
        <p className="mx-auto mt-3 max-w-4xl text-center text-sm font-medium text-ocean-text-secondary sm:text-base lg:hidden">
          {subtitle}
        </p>
      )}
    </header>
  );
}

function SectionHeading({
  section,
  title,
  subtitle,
}: {
  section: ShgSection;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-2">
        <section.icon className="h-4 w-4 opacity-90" aria-hidden="true" />
        <span className="shg-display text-[11px] uppercase tracking-[0.22em] opacity-90">
          Section {section.num} — Fisherwomen SHGs
        </span>
      </div>
      <h1 className="shg-display text-2xl leading-tight drop-shadow-sm sm:text-3xl lg:text-[34px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 hidden max-w-3xl text-sm font-medium text-white/90 sm:text-base lg:block">
          {subtitle}
        </p>
      )}
    </div>
  );
}
