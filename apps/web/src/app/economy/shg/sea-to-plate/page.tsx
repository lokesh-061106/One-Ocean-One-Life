import Image from "next/image";
import { ArrowRight, Recycle, type LucideIcon } from "lucide-react";
import { SHG_SECTIONS } from "@/components/shg/nav";
import { SectionHeader } from "@/components/shg/section-header";
import { FooterBanner } from "@/components/shg/footer-banner";
import { ImpactMetric } from "@/components/shg/impact-metric";
import { CheckGrid } from "@/components/shg/benefit-list";
import { Panel, Lead, Figure, Tag } from "@/components/shg/panel";
import {
  SHG_BYPRODUCTS,
  SHG_ROLES,
  SHG_SDGS,
  SHG_SEA_METRICS,
  SHG_STAGES,
  SHG_VALUE_PRODUCTS,
  SHG_WHEEL,
} from "@/data/shg";

const SDG_COLORS: Record<string, string> = {
  "2": "#DDA63A",
  "8": "#A21942",
  "12": "#BF8B2E",
  "14": "#0A97D9",
};

export default function ShgSeaToPlatePage() {
  const section = SHG_SECTIONS[6];
  const flowStages = SHG_STAGES.filter((stage) =>
    ["harvest", "landing", "market", "meals"].includes(stage.key)
  );
  const future = SHG_STAGES.find((stage) => stage.key === "future");

  return (
    <>
      <SectionHeader
        section={section}
        title="From Sea to Plate to Prosperity"
        subtitle="A Circular Economy for Our Coastal Communities"
        message={["கடல் வளம் • நம் உணவு • நம் வாழ்வு"]}
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-3 pt-7 sm:px-4 lg:px-6">
        <section className="shg-card overflow-hidden">
          <div className="grid items-stretch gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_auto_1fr]">
            <ul className="grid content-center gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {SHG_WHEEL.slice(0, 2).map((item) => (
                <WheelItem key={item.title} {...item} />
              ))}
            </ul>

            <div className="mx-auto my-auto flex w-full max-w-[340px] flex-col text-center">
              <figure className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-full border-4 border-shg-turquoise/40 bg-ocean-foam shadow-[0_12px_30px_rgba(11,36,51,0.15)]">
                <Image
                  src="/shg/p7-plate.webp"
                  alt="Fish meal served on a banana leaf at the centre of the circular economy"
                  fill
                  sizes="280px"
                  className="object-cover"
                />
              </figure>
              <div className="shg-display mt-3 text-base uppercase tracking-[0.14em] text-ocean-navy sm:text-lg">
                Circular Economy
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[12px] font-bold text-shg-forest">
                <span>Less Waste</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reuse Waste</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Healthy People</span>
              </div>
            </div>

            <ul className="grid content-center gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {SHG_WHEEL.slice(2).map((item) => (
                <WheelItem key={item.title} {...item} />
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-ocean-border/70 bg-ocean-foam px-4 py-3">
            <Tag tone="turquoise">Prosperous Communities</Tag>
            <Tag tone="forest">Sustainable use of marine resources</Tag>
            <Tag tone="orange">Value addition</Tag>
            <Tag tone="royal">Nutritious local meals</Tag>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          {SHG_SEA_METRICS.map((metric) => (
            <ImpactMetric
              key={metric.label}
              value={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
              label={metric.label}
              caption={metric.caption}
              icon={metric.icon}
              tone="turquoise"
            />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {flowStages.map((stage) => (
            <Panel key={stage.key} num={stage.num} title={stage.title} sub={stage.tamil} tone="turquoise">
              <CheckGrid items={stage.points} tone="turquoise" />
              {stage.figure && (
                <Figure
                  {...stage.figure}
                  tone="turquoise"
                  fit="cover"
                  className="mt-auto"
                  sizes="(max-width: 768px) 100vw, 24vw"
                />
              )}
            </Panel>
          ))}
        </div>

        <Panel
          num="5"
          title="Value Added Products"
          sub="மீன் மதிப்பு சேர்த்தல் தயாரிப்புகள்"
          tone="orange"
        >
          <Lead>
            Longer shelf life, higher value and more income for women&apos;s groups — these products
            can be sold online too.
          </Lead>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SHG_VALUE_PRODUCTS.map((product, i) => (
              <Figure
                key={product.title}
                {...product.figure}
                caption={product.title}
                tone="orange"
                fit="cover"
                className={
                  i === SHG_VALUE_PRODUCTS.length - 1 ? "sm:col-span-2 lg:col-span-1" : undefined
                }
                sizes="(max-width: 640px) 90vw, 18vw"
              />
            ))}
          </div>
        </Panel>

        <Panel
          num="6"
          title="Local Employment & Income Generation"
          sub="உள்ளூர் வேலைவாய்ப்பு மற்றும் வருமானம்"
          tone="royal"
        >
          <Lead>
            Fishermen, fisherwomen, vendors, food stall owners and women&apos;s self-help groups all
            earn directly from the same catch — better prices, steadier work, more local income.
          </Lead>
          <Figure
            src="/shg/p7-people.webp"
            alt="Fishermen, fisherwomen, vendors and local communities who make up the coastal economy"
            caption="Fishermen · Fisherwomen · Vendors · Local Communities"
            tone="royal"
            ratio="auto"
            sizes="(max-width: 1024px) 100vw, 90vw"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SHG_ROLES.map((role, i) => (
              <article
                key={role.title}
                className={`overflow-hidden rounded-xl border border-ocean-border/70 bg-white ${
                  i === SHG_ROLES.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <figure className="relative aspect-[4/3] bg-ocean-foam">
                  <Image
                    src={role.figure.src}
                    alt={role.figure.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, 18vw"
                    className="object-cover"
                  />
                </figure>
                <div className="space-y-1 p-2.5">
                  <div className="shg-display text-[13px] leading-tight text-ocean-navy">{role.title}</div>
                  <div className="text-[12px] leading-snug text-ocean-text-secondary">{role.detail}</div>
                  {role.points.map((point) => (
                    <div key={point} className="text-[12px] font-semibold leading-snug text-shg-royal">
                      {point}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          num="7"
          title="By-product Utilization (Zero Waste)"
          sub="துணை உற்பத்திகள் - முழு வீண்வீக்கம்"
          tone="forest"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SHG_BYPRODUCTS.map((item, i) => (
              <article
                key={item.title}
                className={`overflow-hidden rounded-xl border border-ocean-border/70 bg-white ${
                  i === SHG_BYPRODUCTS.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <figure className="relative aspect-[4/3] bg-ocean-foam">
                  <Image
                    src={item.figure.src}
                    alt={item.figure.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, 18vw"
                    className="object-cover"
                  />
                </figure>
                <div className="space-y-1 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-shg-forest text-white">
                      <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="shg-display text-[13px] leading-tight text-ocean-navy">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-[12.5px] font-semibold leading-snug text-shg-forest">
                    {item.output}
                  </div>
                  <div className="shg-tamil text-[11.5px] leading-snug text-ocean-text-secondary">
                    {item.tamil}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl bg-shg-forest px-4 py-2.5 text-white">
            <Recycle className="h-4 w-4" aria-hidden="true" />
            <span className="shg-display text-[13px] sm:text-sm">
              Nothing goes to waste — Everything has value!
            </span>
          </div>
        </Panel>

        {future && (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <Panel
              num={future.num}
              title={future.title}
              sub={future.tamil}
              tone="turquoise"
              bodyClassName="justify-center"
            >
              <CheckGrid items={future.points} tone="turquoise" columns={2} />
              <div className="flex flex-wrap gap-2 pt-1">
                {SHG_SDGS.map((sdg) => (
                  <span
                    key={sdg.num}
                    className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold text-white"
                    style={{ backgroundColor: SDG_COLORS[sdg.num] }}
                  >
                    <span className="shg-numeral text-base">{sdg.num}</span>
                    {sdg.label}
                  </span>
                ))}
              </div>
            </Panel>
            {future.figure && (
              <Figure
                {...future.figure}
                tone="turquoise"
                ratio="auto"
                className="self-start"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            )}
          </div>
        )}
      </div>

      <FooterBanner
        slogan="Nothing goes to waste — Everything has value!"
        tagline="Healthy Oceans • Prosperous Communities • Sustainable Livelihoods"
        tone="forest"
        sign="FROM SEA → PLATE → PROSPERITY"
      />
    </>
  );
}

function WheelItem({
  title,
  detail,
  icon: Icon,
}: {
  title: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-ocean-border/70 bg-ocean-foam p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-shg-turquoise text-white">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="shg-display block text-[13px] uppercase tracking-wide text-ocean-navy">
          {title}
        </span>
        <span className="block text-[12.5px] leading-snug text-ocean-text-secondary">{detail}</span>
      </span>
    </li>
  );
}
