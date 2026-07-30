"use client";

import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import type { Profile } from "@/types/database";
import { Badge } from "@/components/ui/badge";

export function Header({
  profile,
  unreadCount,
}: {
  profile: Profile;
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:px-8">
      <div className="pl-12 lg:pl-0">
        <p className="text-sm font-medium text-muted">Welcome back</p>
        <p className="font-semibold text-foreground">{profile.full_name}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="hidden sm:inline-flex capitalize">
          {profile.role.replace("_", " ")}
        </Badge>
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild className="relative">
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </Button>
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
