import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getUnreadCount } from "@/actions/dashboard";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  if (profile.role === "client") {
    redirect("/portal");
  }

  const unreadCount = await getUnreadCount(profile.id).catch(() => 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header profile={profile} unreadCount={unreadCount} />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
