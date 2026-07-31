import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const email = String(params.email || "")
    .toLowerCase()
    .trim();

  if (!email || !email.includes("@")) {
    redirect("/register");
  }

  return (
    <AuthShell>
      <VerifyEmailForm email={email} />
      <p className="mt-4 text-center text-sm text-muted">
        Wrong email?{" "}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Register again
        </Link>
      </p>
    </AuthShell>
  );
}
