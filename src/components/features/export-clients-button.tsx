"use client";

import { exportToCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportClientsButton({
  clients,
}: {
  clients: Record<string, unknown>[];
}) {
  return (
    <Button
      variant="outline"
      onClick={() =>
        exportToCsv(
          clients.map((c) => ({
            name: c.name,
            email: c.email,
            phone: c.phone,
            status: c.status,
            priority: c.priority,
            budget: c.budget,
            industry: c.industry,
          })),
          "clients.csv"
        )
      }
    >
      <Download className="h-4 w-4" /> Export CSV
    </Button>
  );
}
