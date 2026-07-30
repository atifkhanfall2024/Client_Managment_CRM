"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-red-100 p-3 dark:bg-red-950/40">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
