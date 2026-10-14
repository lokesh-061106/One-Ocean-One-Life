import Image from "next/image";
import { SHG_SECTIONS } from "@/components/shg/nav";
import { SectionHeader } from "@/components/shg/section-header";
import { FooterBanner } from "@/components/shg/footer-banner";
import { ImpactMetric } from "@/components/shg/impact-metric";
import { Tag } from "@/components/shg/panel";
import { SHG_FRESH_FISH, SHG_FRESH_METRICS, SHG_HEALTH_CHIPS } from "@/data/shg";

export default function ShgFreshFishPage() {
  const section = SHG_SECTIONS[5];
  return (
    <>
      <SectionHeader
        section={section}
        title="Fresh from the Sea — Delicious on Your Plate!"
        subtitle="Local Fishes · Local Flavours · Healthy Lives"
        message={["Rich in Omega-3", "High Protein", "Supports Local Fisherfolk"]}
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-3 pt-7 sm:px-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <figure className="shg-card overflow-hidden">
            <div className="relative min-h-[240px]">
              <Image
                src="/shg/f-harbour.webp"
                alt="Fisherwomen selling the day's catch at the harbour"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </figure>
          <figure className="shg-card overflow-hidden">
            <div className="relative min-h-[240px]">
              <Image
                src="/shg/f-hero-meal.webp"
                alt="Grilled fish meal served on a banana leaf"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </figure>
        </div>

        <div className="flex flex-wrap gap-2">
          {SHG_HEALTH_CHIPS.map((chip) => (
            <Tag key={chip.label} tone="sky">
              <chip.icon className="h-4 w-4" aria-hidden="true" />
              {chip.label}
            </Tag>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {SHG_FRESH_METRICS.map((metric) => (
            <ImpactMetric
              key={metric.label}
              value={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
              label={metric.label}
              caption={metric.caption}
              icon={metric.icon}
              tone="sky"
            />
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {SHG_FRESH_FISH.map((fish) => (
            <article key={fish.key} className="shg-card shg-card-hover overflow-hidden">
              <figure className="relative aspect-[7/3] bg-ocean-foam">
                <Image
                  src={fish.figure.src}
                  alt={fish.figure.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <figcaption className="shg-numeral absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ocean-navy/85 text-sm text-white">
                  {fish.no}
                </figcaption>
              </figure>

              <div className="space-y-3 p-4">
                <div>
                  <h3 className="shg-display text-lg leading-tight text-ocean-navy">{fish.english}</h3>
                  <div className="shg-tamil text-[14px] text-shg-sky">{fish.tamil}</div>
                  <div className="text-[12px] font-semibold italic text-ocean-text">
                    {fish.translit}
                  </div>
                </div>

                <dl className="divide-y divide-ocean-border/70 overflow-hidden rounded-xl bg-ocean-foam">
                  {fish.names.map((name) => (
                    <div key={name.lang} className="flex items-center justify-between gap-3 px-3 py-1.5">
                      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ocean-text-secondary">
                        {name.lang}
                      </dt>
                      <dd className="text-right">
                        <span className="block text-[13px] font-semibold leading-tight text-ocean-navy">
                          {name.script}
                        </span>
                        {name.translit && (
                          <span className="block text-[11.5px] leading-tight text-ocean-text-secondary">
                            {name.translit}
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          ))}
        </div>
      </div>

      <FooterBanner
        slogan="Tasty Fishes · Healthier Families · Stronger Coastal Communities"
        tagline="Buy Local. Eat Fresh. Support Fisherwomen."
        tone="ocean"
        sign="FRESH FROM THE SEA"
      />
    </>
  );
}
