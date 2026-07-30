"use client";

import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ExportReportButton({
  rows,
}: {
  rows: { metric: string; value: string | number }[];
}) {
  return (
    <Button
      variant="outline"
      onClick={() => exportToCsv(rows, "crm-report.csv")}
    >
      <Download className="h-4 w-4" /> Export CSV
    </Button>
  );
}
