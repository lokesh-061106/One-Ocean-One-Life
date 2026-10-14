import Image from "next/image";
import { SHG_SECTIONS } from "@/components/shg/nav";
import { SectionHeader } from "@/components/shg/section-header";
import { FooterBanner } from "@/components/shg/footer-banner";
import { ImpactMetric } from "@/components/shg/impact-metric";
import { PriceChip } from "@/components/shg/benefit-list";
import { Note, Tag } from "@/components/shg/panel";
import {
  SHG_REVENUE_CHIPS,
  SHG_REVENUE_METRICS,
  SHG_REVENUE_ROWS,
  SHG_DISCLAIMER,
} from "@/data/shg";

function splitPrice(price: string) {
  const [value, ...rest] = price.replace("₹", "").split(" per ");
  return { value, unit: rest.length > 0 ? `per ${rest.join(" per ")}` : undefined };
}

export default function ShgRevenuePage() {
  const section = SHG_SECTIONS[2];
  return (
    <>
      <SectionHeader
        section={section}
        title="Revenue Opportunities for Fisherwomen SHGs"
        subtitle="Multiple products and services can generate steady income throughout the year"
        message={["From Local Resources", "to Brighter", "Futures"]}
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-3 pt-7 sm:px-4 lg:px-6">
        <div className="flex flex-wrap gap-2">
          {SHG_REVENUE_CHIPS.map((chip) => (
            <Tag key={chip} tone="orange">
              {chip}
            </Tag>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <figure className="shg-card overflow-hidden">
            <div className="relative min-h-[220px]">
              <Image
                src="/shg/p3-hero-women.webp"
                alt="Fisherwomen SHG members holding a banner for sustainable livelihoods"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </figure>
          <figure className="shg-card overflow-hidden">
            <div className="relative min-h-[220px]">
              <Image
                src="/shg/p3-hero-boats.webp"
                alt="Fishing boats at the harbour"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </figure>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {SHG_REVENUE_METRICS.map((metric) => (
            <ImpactMetric
              key={metric.label}
              value={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
              label={metric.label}
              caption={metric.caption}
              icon={metric.icon}
              tone="orange"
            />
          ))}
        </div>

        <div className="space-y-4">
          {SHG_REVENUE_ROWS.map((row, index) => {
            const price = splitPrice(row.price);
            return (
              <article key={row.key} className="shg-card shg-card-hover overflow-hidden">
                <div className="grid sm:grid-cols-[220px_1fr]">
                  <div className="relative min-h-[160px] bg-ocean-foam">
                    {row.figure && (
                      <Image
                        src={row.figure.src}
                        alt={row.figure.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, 220px"
                        className="object-cover"
                      />
                    )}
                    <span className="shg-numeral absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ocean-navy/85 text-sm text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="shg-display text-lg leading-tight text-ocean-navy sm:text-xl">
                        {row.activity}
                      </h3>
                      <PriceChip value={price.value} unit={price.unit} tone="orange" />
                    </div>

                    <dl className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl bg-ocean-foam p-3">
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-ocean-text-secondary">
                          What you do
                        </dt>
                        <dd className="mt-0.5 text-[13px] leading-snug text-ocean-text">{row.what}</dd>
                      </div>
                      <div className="rounded-xl bg-ocean-foam p-3">
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-ocean-text-secondary">
                          Market / customers
                        </dt>
                        <dd className="mt-0.5 text-[13px] leading-snug text-ocean-text">{row.market}</dd>
                      </div>
                      <div className="rounded-xl bg-shg-cream p-3 sm:col-span-2">
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-ocean-text-secondary">
                          Monthly / yearly income
                        </dt>
                        <dd className="mt-0.5 text-[13px] font-semibold leading-snug text-shg-forest">
                          {row.income}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <Note>{SHG_DISCLAIMER}</Note>
      </div>

      <FooterBanner
        slogan="Women Create Value from the Sea"
        tagline="Healthy Oceans  |  Prosperous Communities  |  Brighter Tomorrows"
        tone="ocean"
        sign="Sustainable Livelihoods for Fisherwomen"
      />
    </>
  );
}
