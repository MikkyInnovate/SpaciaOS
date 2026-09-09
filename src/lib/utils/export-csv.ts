import type { DashboardLead } from "@/features/dashboard/types";

export function exportLeadsToCSV(leads: DashboardLead[], workspaceName = "pacia") {
  if (!leads || leads.length === 0) return null;

  const headers = [
    "Lead ID",
    "Prospect Name",
    "Phone Number",
    "Email Address",
    "Property of Interest",
    "Target Location",
    "Commercial Budget",
    "Lead Score",
    "Score Category",
    "Operational Status",
    "Buyer Intent",
    "Decision Timeline",
    "Next Action",
    "Created Date",
    "AI Qualification Notes",
  ];

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map((lead) => [
    escapeCSV(lead.id),
    escapeCSV(lead.name),
    escapeCSV(lead.phone),
    escapeCSV(lead.email),
    escapeCSV(lead.propertyTitle),
    escapeCSV(lead.location),
    escapeCSV(lead.budget),
    escapeCSV(lead.score),
    escapeCSV(lead.scoreCategory),
    escapeCSV(lead.status),
    escapeCSV(lead.intent),
    escapeCSV(lead.timeline),
    escapeCSV(lead.nextAction),
    escapeCSV(lead.createdAt),
    escapeCSV(lead.aiNotes),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

  // UTF-8 BOM (\uFEFF) ensures Excel and Google Sheets render Naira ₦ and symbols accurately
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  const safeWorkspace = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const filename = `${safeWorkspace}-leads-${dateStr}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { filename, count: leads.length };
}
