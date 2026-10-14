import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Recycle } from "lucide-react";
import { SHG_SECTIONS } from "@/components/shg/nav";
import { FooterBanner } from "@/components/shg/footer-banner";

export default function ShgHomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-shg-forest via-ocean-deep to-shg-royal text-white">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-14 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-6 lg:py-20">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.3em] text-shg-yellow">
              <Recycle className="h-4 w-4" aria-hidden="true" />
              Fisherwomen SHGs
            </div>
            <h1 className="shg-display mt-3 text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              FROM WASTE <span className="text-shg-yellow">TO WEALTH</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
              Empowering Fisherwomen SHGs through Circular Economy, Finance, Value Addition and
              Smart Marketing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/economy/shg/circular-economy"
                className="inline-flex items-center gap-2 rounded-full bg-shg-yellow px-6 py-3 text-sm font-bold text-ocean-navy shadow-lg transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Explore the Fisherwomen SHG Model{" "}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/economy/shg/revenue"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                View Revenue Opportunities
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="shg-card relative overflow-hidden">
              <Image
                src="/shg/p3-hero-women.webp"
                alt="Fisherwomen SHG members processing the day's catch together"
                width={892}
                height={514}
                sizes="40vw"
                className="h-full w-full object-cover"
                priority
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-ocean-navy/85 px-4 py-2.5 text-[13px] font-semibold text-white">
                Women-led groups turn local resources into steady, year-round income.
              </figcaption>
            </div>
            <div className="absolute -left-6 -top-6 rotate-[-4deg] rounded-2xl bg-shg-yellow px-4 py-3 text-ocean-navy shadow-xl">
              <div className="shg-display text-xl leading-none">7 Sections</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]">
                Waste · Finance · Market
              </div>
            </div>
            <div className="absolute bottom-16 right-4 rotate-3 rounded-2xl border border-white/40 bg-white/95 px-4 py-3 text-ocean-navy shadow-xl">
              <div className="shg-display text-xl leading-none">₹1–3 lakh</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-ocean-text-secondary">
                Potential monthly income
              </div>
            </div>
          </div>
        </div>
      </section>

        <section className="mx-auto max-w-[1440px] px-3 pt-10 sm:px-4 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["Waste to Wealth", "Circular Economy", "Finance", "Value Addition", "Smart Marketing"].map(
            (chip) => (
              <span
                key={chip}
                className="rounded-full bg-shg-forest/10 px-3 py-1.5 text-[12px] font-bold text-shg-forest"
              >
                {chip}
              </span>
            )
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SHG_SECTIONS.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              className="shg-card shg-card-hover group flex items-start gap-3 p-5"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${section.chip}`}>
                <section.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="shg-display block text-base text-ocean-navy">{section.label}</span>
                <span className="mt-1 block text-[13px] text-ocean-text-secondary">Section {section.num}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <figure className="shg-card flex flex-col overflow-hidden">
            <div className="relative min-h-[180px] flex-1">
              <Image
                src="/shg/p1-woman-processing.webp"
                alt="Fisherwoman processing fish waste into useful products"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-auto min-h-[62px] px-4 py-3 text-[13px] text-ocean-text-secondary">
              From waste to wealth — fish by-products become feed, fertilizer and fuel.
            </figcaption>
          </figure>
          <figure className="shg-card flex flex-col overflow-hidden">
            <div className="relative min-h-[180px] flex-1">
              <Image
                src="/shg/p3-hero-women.webp"
                alt="Fisherwomen SHG members campaigning for sustainable livelihoods"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-auto min-h-[62px] px-4 py-3 text-[13px] text-ocean-text-secondary">
              Women-led groups turn local resources into steady, year-round income.
            </figcaption>
          </figure>
          <figure className="shg-card flex flex-col overflow-hidden">
            <div className="relative min-h-[180px] flex-1">
              <Image
                src="/shg/f-hero-meal.webp"
                alt="Fresh fish meal served on a banana leaf"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-auto min-h-[62px] px-4 py-3 text-[13px] text-ocean-text-secondary">
              Fresh from the sea to the plate — and back into a healthier ocean.
            </figcaption>
          </figure>
        </div>
      </section>

      <FooterBanner
        slogan="Women create value from the sea"
        tagline="Healthy Oceans • Prosperous Communities • Sustainable Livelihoods"
        tone="ocean"
      />
    </>
  );
}
