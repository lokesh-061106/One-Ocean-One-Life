import type { Metadata } from "next";
import { shgFontVars } from "@/components/shg/fonts";
import { ShgShell } from "@/components/shg/shg-shell";

export const metadata: Metadata = {
  title: "Fisherwomen SHGs — From Waste to Wealth | One Ocean One Life",
  description:
    "An interactive handbook for Fisherwomen Self-Help Groups: circular economy, revenue opportunities, loans, recipes, fresh fish marketing and the sea-to-plate journey.",
};

export default function ShgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={shgFontVars}>
      <ShgShell>{children}</ShgShell>
    </div>
  );
}
