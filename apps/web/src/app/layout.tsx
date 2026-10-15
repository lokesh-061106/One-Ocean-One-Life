import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BackToTop } from "@/components/layout/back-to-top";
import { getInitialMenuConfig } from "@/lib/server-menu";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "O3L — One Ocean One Life",
  description:
    "Connect People. Understand the Ocean. Protect Marine Life. Build Coastal Livelihoods.",
  icons: { icon: "/o3l-logo.png" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Server-side seed: the first paint already shows the live header
     style and menu items (no flash of the placeholder menu). */
  const initialMenu = await getInitialMenuConfig();

  return (
    <html lang="en">
      <body className={inter.variable} suppressHydrationWarning>
        <Providers
          initialHeaderMenu={initialMenu.headerMenu}
          initialMenuItems={initialMenu.menuItems}
        >
          {children}
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
