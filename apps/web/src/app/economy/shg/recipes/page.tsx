import Image from "next/image";
import { Clock, UtensilsCrossed } from "lucide-react";
import { SHG_SECTIONS } from "@/components/shg/nav";
import { SectionHeader } from "@/components/shg/section-header";
import { FooterBanner } from "@/components/shg/footer-banner";
import { Tag } from "@/components/shg/panel";
import { SHG_RECIPES } from "@/data/shg";

export default function ShgRecipesPage() {
  const section = SHG_SECTIONS[4];
  return (
    <>
      <SectionHeader
        section={section}
        title="10 Popular South Indian Fishes — Simple & Delicious Recipes"
        subtitle="Fresh from Our Coast to Your Plate!"
        message={["Local Fish", "Traditional Recipe", "Fresh from Coast"]}
      />

      <div className="mx-auto max-w-[1440px] px-3 pt-7 sm:px-4 lg:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          {SHG_RECIPES.map((recipe) => (
            <article key={recipe.key} className="shg-card shg-card-hover overflow-hidden">
              <div className="grid grid-cols-2 bg-ocean-foam">
                <figure className="relative aspect-[4/3]">
                  <Image
                    src={recipe.fishFigure.src}
                    alt={recipe.fishFigure.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-ocean-navy/75 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Fresh fish
                  </figcaption>
                </figure>
                <figure className="relative aspect-[4/3]">
                  <Image
                    src={recipe.dishFigure.src}
                    alt={recipe.dishFigure.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-shg-magenta/85 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Prepared dish
                  </figcaption>
                </figure>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="shg-numeral flex h-9 w-9 items-center justify-center rounded-full bg-shg-magenta text-base text-white">
                      {recipe.no}
                    </span>
                    <div>
                      <h3 className="shg-display text-lg leading-tight text-ocean-navy">{recipe.fish}</h3>
                      <div className="shg-tamil text-[13px] text-shg-magenta">{recipe.tamil}</div>
                    </div>
                  </div>
                  <Tag tone="magenta">{recipe.translit}</Tag>
                </div>

                <div className="rounded-xl border border-shg-magenta/25 bg-shg-cream px-3 py-2">
                  <span className="shg-display text-[15px] text-shg-magenta sm:text-base">
                    {recipe.dish}
                  </span>
                </div>

                <ul className="space-y-1">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={ingredient} className="flex items-start gap-2 text-[13px] text-ocean-text">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-shg-orange" aria-hidden="true" />
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-lg border border-ocean-border/70 bg-ocean-foam px-3 py-2 text-[12.5px] text-ocean-text">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ocean-blue" aria-hidden="true" />
                    <span>{recipe.cook}</span>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-shg-cream px-3 py-2 text-[12.5px] text-ocean-text">
                    <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0 text-shg-orange" aria-hidden="true" />
                    <span>{recipe.serve}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <FooterBanner
        slogan="Try Local · Buy Fresh · Support Fisherwomen"
        tagline="Fresh from Our Coast to Your Plate!"
        tone="orange"
        sign="ORDER FROM YOUR LOCAL SHG"
      />
    </>
  );
}
