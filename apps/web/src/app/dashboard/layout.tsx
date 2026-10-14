import { DashboardDataProvider } from "@/components/dashboard-data-context";

export const dynamic = "force-dynamic";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <DashboardDataProvider>{children}</DashboardDataProvider>;
}
