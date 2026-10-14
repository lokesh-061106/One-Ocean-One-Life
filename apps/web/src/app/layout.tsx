import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BackToTop } from "@/components/layout/back-to-top";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable} suppressHydrationWarning>
        <Providers>
          {children}
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
