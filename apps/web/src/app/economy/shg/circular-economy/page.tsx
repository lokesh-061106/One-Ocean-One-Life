import { SHG_SECTIONS } from "@/components/shg/nav";
import { SectionHeader } from "@/components/shg/section-header";
import { FooterBanner } from "@/components/shg/footer-banner";
import { ImpactMetric } from "@/components/shg/impact-metric";
import { BenefitList, CheckGrid } from "@/components/shg/benefit-list";
import { Panel, Lead, Figure, Note } from "@/components/shg/panel";
import { SHG_PILLARS, SHG_CIRCULAR_METRICS, SHG_DISCLAIMER } from "@/data/shg";

export default function ShgCircularEconomyPage() {
  const section = SHG_SECTIONS[0];
  return (
    <>
      <SectionHeader
        section={section}
        title="Why the Current SHG Model is Already a Circular Economy"
        subtitle="Fisherwomen SHGs are already practicing a circular economy by reducing waste, reusing resources and regenerating nature."
        message={["From Waste", "to Wealth", "for Cleaner Seas", "and Stronger Communities"]}
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-3 pt-7 sm:px-4 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {SHG_CIRCULAR_METRICS.map((metric) => (
            <ImpactMetric
              key={metric.label}
              value={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
              label={metric.label}
              caption={metric.caption}
              icon={metric.icon}
              tone="forest"
            />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {SHG_PILLARS.map((pillar) => (
            <Panel
              key={pillar.key}
              num={pillar.num}
              title={pillar.title}
              sub={pillar.sub}
              tone={pillar.tone}
            >
              <Lead>{pillar.body}</Lead>

              <div className="grid grid-cols-2 gap-3">
                {pillar.figures.map((figure) => (
                  <Figure
                    key={figure.src}
                    {...figure}
                    tone={pillar.tone}
                    sizes="(max-width: 1024px) 50vw, 22vw"
                  />
                ))}
              </div>

              {pillar.facts && (
                <div className="rounded-xl border border-ocean-border/70 bg-ocean-foam p-3">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ocean-text-secondary">
                    Why it works
                  </div>
                  <CheckGrid items={pillar.facts} tone={pillar.tone} />
                </div>
              )}

              <BenefitList title="Benefits" items={pillar.benefits} tone={pillar.tone} />
            </Panel>
          ))}
        </div>

        <Note>{SHG_DISCLAIMER}</Note>
      </div>

      <FooterBanner
        slogan="Fisherwomen SHGs: People, Prosperity and a Healthier Ocean"
        chain={["Less Waste", "More Income", "Cleaner Environment", "Stronger Communities"]}
        imageLeft="/shg/p1-banner-women.webp"
        imageRight="/shg/p1-banner-boats.webp"
        tone="forest"
        sign="CLEAN SEAS · BRIGHTER FUTURES"
      />
    </>
  );
}
