import { SHG_SECTIONS } from "@/components/shg/nav";
import { SectionHeader } from "@/components/shg/section-header";
import { FooterBanner } from "@/components/shg/footer-banner";
import { ImpactMetric } from "@/components/shg/impact-metric";
import { CheckGrid } from "@/components/shg/benefit-list";
import { Panel, Figure, DataTable, Note } from "@/components/shg/panel";
import {
  SHG_LOAN_STEPS,
  SHG_LOAN_METRICS,
  SHG_SCHEMES,
  SHG_DOCUMENTS,
  SHG_OTHER_SUPPORT,
  SHG_DISCLAIMER,
} from "@/data/shg";

export default function ShgLoansPage() {
  const section = SHG_SECTIONS[3];
  return (
    <>
      <SectionHeader
        section={section}
        title="How to Get Loans and Financial Support"
        subtitle="Turn your ideas into income — Banks and Government are ready to support Fisherwomen SHGs!"
        message={["Financial Support", "for Stronger", "Fisherwomen", "and Cleaner Oceans"]}
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-3 pt-7 sm:px-4 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {SHG_LOAN_METRICS.map((metric) => (
            <ImpactMetric
              key={metric.label}
              value={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
              label={metric.label}
              caption={metric.caption}
              icon={metric.icon}
              tone="purple"
            />
          ))}
        </div>

        <div>
          <h2 className="shg-display mb-3 text-lg text-ocean-navy sm:text-xl">
            Steps to Get a Loan through SHG
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SHG_LOAN_STEPS.map((step) => (
              <Panel key={step.key} num={step.num} title={step.title} tone="purple">
                <CheckGrid items={step.points} tone="purple" />
                {step.figure && (
                  <Figure
                    {...step.figure}
                    tone="purple"
                    className="mt-auto"
                    sizes="(max-width: 768px) 100vw, 30vw"
                  />
                )}
              </Panel>
            ))}

            <Panel title="Other Support Available" sub="Beyond the loan itself" tone="royal">
              <ul className="space-y-2.5">
                {SHG_OTHER_SUPPORT.map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl border border-ocean-border/70 bg-ocean-foam p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-shg-royal text-white">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="shg-display block text-[13.5px] text-ocean-navy">{item.title}</span>
                      <span className="block text-[12.5px] leading-snug text-ocean-text-secondary">
                        {item.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[1.25fr_1fr]">
          <DataTable
            caption="Major Government Schemes for SHGs"
            head={["Scheme / Program", "Purpose / Support", "Loan Amount (Approx.)"]}
            rows={SHG_SCHEMES.map((scheme) => [scheme.name, scheme.purpose, scheme.amount])}
            tone="purple"
          />

          <Panel title="Documents Required" sub="Keep your records clear and updated" tone="forest">
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <CheckGrid items={SHG_DOCUMENTS} tone="forest" columns={2} />
              <div className="space-y-3">
                <Figure
                  src="/shg/p4-documents.webp"
                  alt="Checklist of documents required for an SHG loan"
                  tone="forest"
                  ratio="auto"
                  sizes="200px"
                />
                <p className="rounded-xl border border-shg-amber/40 bg-shg-yellow/30 px-3 py-2 text-center text-[12.5px] font-semibold italic text-ocean-navy">
                  Carry originals plus photocopies — and keep the SHG ledger updated.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <Figure
          src="/shg/p4-group-sign.webp"
          alt="Fisherwomen holding a banner reading Strong SHGs equal prosperous fisherwomen and cleaner oceans"
          caption="Empowered Women · Stronger Communities · Healthier Oceans"
          tone="purple"
          ratio="auto"
          className="mx-auto max-w-3xl"
          sizes="(max-width: 768px) 100vw, 760px"
        />

        <Note>{SHG_DISCLAIMER}</Note>
      </div>

      <FooterBanner
        slogan="Financial Support + Training + Market Linkages = Sustainable Income for Fisherwomen SHGs"
        tone="purple"
        sign="STRONG SHGs · PROSPEROUS FISHERWOMEN · CLEANER OCEANS"
      />
    </>
  );
}
