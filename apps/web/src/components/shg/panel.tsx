import Image from "next/image";
import { cn } from "@/lib/utils";

export type ShgTone =
  | "forest"
  | "sky"
  | "orange"
  | "royal"
  | "purple"
  | "magenta"
  | "turquoise"
  | "ink";

const BAR: Record<ShgTone, string> = {
  forest: "bg-shg-forest",
  sky: "bg-shg-sky",
  orange: "bg-shg-orange",
  royal: "bg-shg-royal",
  purple: "bg-shg-purple",
  magenta: "bg-shg-magenta",
  turquoise: "bg-shg-turquoise",
  ink: "bg-ocean-navy",
};

const SOFT: Record<ShgTone, string> = {
  forest: "bg-shg-forest/10 text-shg-forest",
  sky: "bg-shg-sky/10 text-shg-sky",
  orange: "bg-shg-orange/10 text-shg-orange",
  royal: "bg-shg-royal/10 text-shg-royal",
  purple: "bg-shg-purple/10 text-shg-purple",
  magenta: "bg-shg-magenta/10 text-shg-magenta",
  turquoise: "bg-shg-turquoise/10 text-shg-turquoise",
  ink: "bg-ocean-navy/10 text-ocean-navy",
};

export function Panel({
  title,
  sub,
  num,
  tone = "forest",
  children,
  className,
  bodyClassName,
}: {
  title: string;
  sub?: string;
  num?: string;
  tone?: ShgTone;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("shg-card flex flex-col overflow-hidden", className)}>
      <div className={cn("flex items-center gap-3 px-4 py-3 text-white", BAR[tone])}>
        {num && (
          <span className="shg-numeral flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-white/15 text-base">
            {num}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="shg-display text-base leading-tight sm:text-lg">{title}</h2>
          {sub && <p className="text-[12px] font-semibold text-white/85 sm:text-[13px]">{sub}</p>}
        </div>
      </div>
      <div className={cn("flex flex-1 flex-col space-y-3 p-4 sm:p-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

export function Lead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[14px] leading-relaxed text-ocean-text sm:text-[15px]", className)}>
      {children}
    </p>
  );
}

export function Figure({
  src,
  alt,
  caption,
  price,
  tone = "ink",
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  ratio = "aspect-[16/10]",
  fit = "contain",
  priority,
}: {
  src: string;
  alt: string;
  caption?: string;
  price?: string;
  tone?: ShgTone;
  className?: string;
  sizes?: string;
  /** Fixed crop box so rows of cards stay aligned — pass "auto" to keep the image's natural shape */
  ratio?: string;
  /** contain keeps every pixel visible (infographic art); cover fills the box edge-to-edge (photos) */
  fit?: "contain" | "cover";
  priority?: boolean;
}) {
  const fixed = ratio !== "auto";
  return (
    <figure className={cn("shg-card flex flex-col overflow-hidden bg-white", className)}>
      <div className={cn("relative overflow-hidden bg-ocean-foam", fixed && ratio)}>
        <Image
          src={src}
          alt={alt}
          width={640}
          height={440}
          sizes={sizes}
          priority={priority}
          className={cn(
            "w-full",
            fixed ? "h-full" : "h-auto",
            fit === "cover" ? "object-cover" : "object-contain"
          )}
        />
        {price && (
          <span
            className={cn(
              "absolute right-2 top-2 rounded-full px-2 py-1 text-[11px] font-bold text-white shadow-sm",
              BAR[tone]
            )}
          >
            {price}
          </span>
        )}
      </div>
      <div aria-hidden="true" className="flex-1 bg-ocean-foam" />
      {caption && (
        <figcaption className="border-t border-ocean-border/70 px-3 py-2">
          <span className="shg-display block text-[12px] leading-tight text-ocean-navy sm:text-[13px]">
            {caption}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

export function DataTable({
  head,
  rows,
  tone = "forest",
  className,
  caption,
}: {
  head: string[];
  rows: React.ReactNode[][];
  tone?: ShgTone;
  className?: string;
  caption?: string;
}) {
  return (
    <div className={cn("shg-card overflow-hidden", className)}>
      {caption && (
        <div className={cn("px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-white", BAR[tone])}>
          {caption}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
          <thead>
            <tr className={cn("text-white", BAR[tone])}>
              {head.map((cell) => (
                <th key={cell} className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide sm:text-xs">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={cn("border-t border-ocean-border/70", i % 2 === 1 && "bg-ocean-foam")}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      "px-3 py-2.5 align-top leading-snug text-ocean-text",
                      j === 0 && "shg-display text-ocean-navy"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-ocean-border/70 px-3 py-1.5 text-[11px] font-semibold text-ocean-text-secondary sm:hidden">
        Scroll the table sideways to see all columns →
      </div>
    </div>
  );
}

export function Tag({
  children,
  tone = "forest",
  className,
}: {
  children: React.ReactNode;
  tone?: ShgTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold sm:text-[13px]",
        SOFT[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "rounded-xl border border-shg-amber/40 bg-shg-cream px-4 py-3 text-[12.5px] leading-relaxed text-ocean-text sm:text-[13px]",
        className
      )}
    >
      {children}
    </p>
  );
}
