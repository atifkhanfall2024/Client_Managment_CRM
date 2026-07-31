import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AuthBrandBackground } from "@/components/auth/auth-brand-background";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <AuthBrandBackground />

      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}
