"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLeadStore, type EnrichedLead } from "@/store/useLeadStore";
import { leadsToCSV, downloadCSV } from "@/lib/exportCsv";
import { Download, Globe, Mail, Phone, Table2, Target, ChevronRight } from "lucide-react";

const TIER_BADGE: Record<EnrichedLead["tier"], { label: string; className: string }> = {
  hot:  { label: "Hot",  className: "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_8px_rgba(251,113,133,0.3)]" },
  warm: { label: "Warm", className: "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]" },
  cold: { label: "Cold", className: "bg-zinc-500/20 text-zinc-300 border-zinc-500/50" },
};

function ContactCell({ lead }: { lead: EnrichedLead }) {
  return (
    <div className="flex flex-col gap-1 text-xs" onClick={(e) => e.stopPropagation()}>
      {lead.phone && (
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Phone className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.phone}</span>
        </a>
      )}
      {lead.email && (
        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[160px]">{lead.email}</span>
        </a>
      )}
      {lead.website && (
        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[160px]">{lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
        </a>
      )}
      {!lead.phone && !lead.email && !lead.website && (
        <span className="text-muted-foreground/50 italic">No contact info</span>
      )}
    </div>
  );
}

export default function LeadsTable() {
  const scoredLeads   = useLeadStore((s) => s.scoredLeads);
  const exportTier    = useLeadStore((s) => s.exportTier);
  const status        = useLeadStore((s) => s.status);
  const selectedLead  = useLeadStore((s) => s.selectedLead);
  const setSelectedLead = useLeadStore((s) => s.setSelectedLead);

  const visibleLeads = scoredLeads.filter((l) => {
    if (exportTier === "hot")      return l.tier === "hot";
    if (exportTier === "hot_warm") return l.tier === "hot" || l.tier === "warm";
    return true;
  });

  function handleExport() {
    const csv = leadsToCSV(visibleLeads);
    downloadCSV(csv, `leads_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="glass-panel flex-1 flex flex-col rounded-lg overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-200">Lead Results</h2>
          {visibleLeads.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {visibleLeads.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedLead && (
            <span className="text-[10px] text-zinc-500">Click a row to inspect · ESC to close</span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 bg-transparent border-white/20 hover:bg-white/10 hover:text-white"
            disabled={visibleLeads.length === 0 || status === "scraping" || status === "enriching"}
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[2fr_2fr_80px_3fr_20px] px-4 py-2.5 bg-black/40 border-b border-white/10 text-xs font-medium text-zinc-400 uppercase tracking-wider shrink-0">
        <span>Business Name</span>
        <span>Contact Info</span>
        <span>Tier</span>
        <span>AI Outreach Line</span>
        <span />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {visibleLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative w-24 h-24 rounded-full bg-[#1a1a24] border border-[#d946ef]/20 shadow-[0_0_30px_rgba(217,70,239,0.15)] flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border border-[#d946ef]/10 scale-110" />
              <div className="absolute inset-0 rounded-full border border-[#d946ef]/5 scale-125" />
              <Target className="h-12 w-12 text-[#d946ef] drop-shadow-[0_0_8px_rgba(217,70,239,0.5)] relative z-10" />
            </div>
            <h3 className="text-lg font-semibold text-white">No Leads Generated Yet</h3>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm">
              Configure your criteria on the left to start finding potential leads.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {visibleLeads.map((lead, i) => {
              const badge     = TIER_BADGE[lead.tier];
              const isSelected = selectedLead === lead;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedLead(isSelected ? null : lead)}
                  className={`grid grid-cols-[2fr_2fr_80px_3fr_20px] px-4 py-3 text-sm transition-colors items-start gap-2 cursor-pointer group ${
                    isSelected
                      ? "bg-fuchsia-500/8 border-l-2 border-fuchsia-500"
                      : "hover:bg-white/5 border-l-2 border-transparent"
                  }`}
                >
                  {/* Name + address */}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{lead.name}</p>
                    {lead.address && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.address}</p>
                    )}
                    {lead.rating != null && (
                      <p className="text-xs text-yellow-500 mt-0.5">
                        {"★".repeat(Math.round(lead.rating))}
                        {"☆".repeat(5 - Math.round(lead.rating))}
                        <span className="text-muted-foreground ml-1">{lead.rating.toFixed(1)}</span>
                      </p>
                    )}
                    {/* Project-mode extras */}
                    {lead.platform && (
                      <p className="text-[10px] text-zinc-600 mt-0.5">{lead.platform}</p>
                    )}
                    {lead.budget && (
                      <p className="text-[10px] text-green-500/70 mt-0.5">{lead.budget}</p>
                    )}
                  </div>

                  <ContactCell lead={lead} />

                  <div>
                    <Badge variant="outline" className={`text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </Badge>
                    {/* News indicator */}
                    {lead.articles && lead.articles.length > 0 && (
                      <div className="mt-1 text-[10px] text-zinc-600 flex items-center gap-0.5">
                        📰 {lead.articles.length} article{lead.articles.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {lead.aiLine
                      ? <span className="text-foreground">{lead.aiLine}</span>
                      : <span className="italic opacity-50">—</span>
                    }
                  </div>

                  {/* Row expand caret */}
                  <div className="flex items-center justify-end">
                    <ChevronRight className={`h-3.5 w-3.5 text-zinc-600 transition-all duration-150 ${
                      isSelected ? "text-fuchsia-400 rotate-90" : "group-hover:text-zinc-400"
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
