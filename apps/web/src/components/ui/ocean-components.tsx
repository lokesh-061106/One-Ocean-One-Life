"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark" | "tinted";
  hover?: boolean;
}

export function GlassCard({ children, className, variant = "light", hover = true }: GlassCardProps) {
  const variants = {
    light: "glass",
    dark: "glass-dark",
    tinted: "glass-tinted",
  };
  return (
    <div className={cn(
      variants[variant],
      "rounded-xl p-6",
      hover && "hover-lift transition-all duration-200",
      className
    )}>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton h-4 rounded", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <Skeleton className="h-40 rounded-lg mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

const STAT_COLORS: Record<string, { bg: string; text: string }> = {
  "ocean-blue": { bg: "bg-ocean-blue/10", text: "text-ocean-blue" },
  "ocean-green": { bg: "bg-ocean-green/10", text: "text-ocean-green" },
  "ocean-coral": { bg: "bg-ocean-coral/10", text: "text-ocean-coral" },
  "ocean-navy": { bg: "bg-ocean-navy/10", text: "text-ocean-navy" },
  "ocean-success": { bg: "bg-ocean-success/10", text: "text-ocean-success" },
  "ocean-warning": { bg: "bg-ocean-warning/10", text: "text-ocean-warning" },
};

export function StatCard({ value, label, icon, color = "ocean-blue" }: {
  value: string | number; label: string; icon: string; color?: string;
}) {
  const colors = STAT_COLORS[color] || STAT_COLORS["ocean-blue"];
  return (
    <div className="bg-white rounded-xl p-6 text-center shadow-sm hover-lift">
      <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-3`}>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
      <p className="text-sm text-ocean-text-secondary mt-1">{label}</p>
    </div>
  );
}

export function SectionHeader({ title, subtitle, action, onAction }: {
  title: string; subtitle?: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-bold text-ocean-navy">{title}</h2>
        {subtitle && <p className="text-sm text-ocean-text-secondary mt-1">{subtitle}</p>}
      </div>
      {action && onAction && (
        <button onClick={onAction} className="text-sm font-semibold text-ocean-blue hover:text-ocean-blue/80 transition-colors">
          {action}
        </button>
      )}
    </div>
  );
}
