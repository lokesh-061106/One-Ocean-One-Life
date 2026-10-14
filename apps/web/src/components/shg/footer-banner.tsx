import Image from "next/image";
import { cn } from "@/lib/utils";

interface FooterBannerProps {
  /** Script-style slogan across the banner */
  slogan: string | React.ReactNode;
  /** Small italic line under the slogan */
  tagline?: string;
  /** Extra chain like "Less Waste → More Income → …" */
  chain?: string[];
  imageLeft?: string;
  imageRight?: string;
  tone?: "ocean" | "forest" | "orange" | "purple";
  sign?: string;
  className?: string;
}

const TONES: Record<string, string> = {
  ocean: "from-ocean-blue via-shg-turquoise to-ocean-green",
  forest: "from-shg-forest via-emerald-600 to-shg-turquoise",
  orange: "from-shg-orange via-amber-500 to-shg-yellow",
  purple: "from-shg-purple via-indigo-700 to-ocean-blue",
};

/** Closing wave banner used at the bottom of every programme page. */
export function FooterBanner({
  slogan,
  tagline,
  chain,
  imageLeft,
  imageRight,
  tone = "ocean",
  sign,
  className,
}: FooterBannerProps) {
  return (
    <section
      className={cn(
        "shg-no-print relative mt-6 overflow-hidden bg-gradient-to-r text-white",
        TONES[tone],
        className
      )}
      aria-label={typeof slogan === "string" ? slogan : undefined}
    >
      {/* wave crest */}
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-8 w-full sm:h-12"
      >
        <path
          d="M0,60 C180,10 360,90 540,50 C720,10 900,90 1080,50 C1260,10 1380,70 1440,45 L1440,0 L0,0 Z"
          fill="#F8FCFC"
        />
      </svg>

      {imageLeft && (
        <Image
          src={imageLeft}
          alt=""
          aria-hidden="true"
          width={340}
          height={200}
          className="pointer-events-none absolute bottom-0 left-0 hidden h-auto w-[220px] object-contain object-bottom opacity-95 md:block lg:w-[300px]"
        />
      )}
      {imageRight && (
        <Image
          src={imageRight}
          alt=""
          aria-hidden="true"
          width={340}
          height={200}
          className="pointer-events-none absolute bottom-0 right-0 hidden h-auto w-[220px] object-contain object-bottom opacity-95 md:block lg:w-[300px]"
        />
      )}

      <div
        className={cn(
          "relative mx-auto max-w-[1440px] px-4 pb-7 pt-14 text-center sm:pt-16",
          imageLeft || imageRight ? "md:px-[240px] lg:px-[330px]" : "md:px-24 lg:px-40"
        )}
      >
        {chain && chain.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] font-bold uppercase tracking-wide sm:text-base">
            {chain.map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                <span className="drop-shadow">{item}</span>
                {i < chain.length - 1 && <span aria-hidden="true">→</span>}
              </span>
            ))}
          </div>
        )}

        <p className="shg-script text-3xl leading-tight drop-shadow-md sm:text-4xl lg:text-5xl">
          {slogan}
        </p>

        {tagline && (
          <p className="mt-2 text-sm font-medium italic text-white/90 sm:text-base">{tagline}</p>
        )}

        {sign && (
          <div className="mx-auto mt-4 inline-block rotate-[-2deg] rounded-lg border-2 border-white/70 bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
            <span className="shg-display block text-[13px] leading-tight tracking-wide sm:text-base">
              {sign}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
