import type { EnrichedLead } from "@/store/useLeadStore";

function escapeCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function leadsToCSV(leads: EnrichedLead[]): string {
  const headers = ["Name", "Address", "Website", "Phone", "Email", "Rating", "Tier", "Platform", "Budget", "AI Outreach Line"];
  const rows = leads.map((l) => [
    escapeCell(l.name),
    escapeCell(l.address),
    escapeCell(l.website),
    escapeCell(l.phone),
    escapeCell(l.email),
    escapeCell(l.rating),
    escapeCell(l.tier),
    escapeCell(l.platform),
    escapeCell(l.budget),
    escapeCell(l.aiLine),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCSV(csv: string, filename = "leads.csv") {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
