import { SHG_SECTIONS } from "@/components/shg/nav";
import { SectionHeader } from "@/components/shg/section-header";
import { FooterBanner } from "@/components/shg/footer-banner";
import { ImpactMetric } from "@/components/shg/impact-metric";
import { BenefitList } from "@/components/shg/benefit-list";
import { Panel, Lead, Figure, Note } from "@/components/shg/panel";
import { SHG_STRATEGIES, SHG_STRATEGY_METRICS, SHG_DISCLAIMER } from "@/data/shg";

function ProblemSolution({
  problem,
  solution,
}: {
  problem: string;
  solution: string;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-shg-magenta">
          Problem
        </div>
        <p className="text-[13px] leading-relaxed text-ocean-text sm:text-sm">{problem}</p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-shg-forest">
          Solution
        </div>
        <p className="text-[13px] leading-relaxed text-ocean-text sm:text-sm">{solution}</p>
      </div>
    </div>
  );
}

export default function ShgStrategiesPage() {
  const section = SHG_SECTIONS[1];
  return (
    <>
      <SectionHeader
        section={section}
        title="How to Bring / Deepen the Circular Economy"
        subtitle="Four key strategies to make Fisherwomen SHGs a full zero-waste, sustainable model"
        message={["Local Resources", "Clean Energy", "More Value", "Stronger Communities"]}
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-3 pt-7 sm:px-4 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {SHG_STRATEGY_METRICS.map((metric) => (
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

        <div className="grid gap-5 lg:grid-cols-2">
          {SHG_STRATEGIES.map((strategy) => (
            <Panel
              key={strategy.key}
              num={strategy.num}
              title={strategy.title}
              sub={strategy.sub}
              tone={strategy.tone}
            >
              <Lead>{strategy.lead}</Lead>

              <ProblemSolution
                problem={strategy.problem}
                solution={strategy.solution}
              />

              <div
                className={`grid gap-3 ${
                  strategy.figures.length === 3
                    ? "grid-cols-2 sm:grid-cols-3"
                    : "grid-cols-2"
                }`}
              >
                {strategy.figures.map((figure) => (
                  <Figure
                    key={figure.src}
                    {...figure}
                    tone={strategy.tone}
                    sizes="(max-width: 640px) 33vw, 20vw"
                  />
                ))}
              </div>

              <BenefitList title="Benefits & Revenue" items={strategy.benefits} tone={strategy.tone} />
            </Panel>
          ))}
        </div>

        <Note>{SHG_DISCLAIMER}</Note>
      </div>

      <FooterBanner
        slogan="“Women Led • Waste to Wealth • Healthy Oceans • Sustainable Future”"
        chain={["Clean Energy", "Smart Technology", "Zero Waste", "A Stronger Blue Economy"]}
        imageLeft="/shg/p2-banner-women.webp"
        imageRight="/shg/p2-banner-sign.webp"
        tone="ocean"
        sign="OUR OCEAN · OUR LIVELIHOOD · OUR FUTURE"
      />
    </>
  );
}
