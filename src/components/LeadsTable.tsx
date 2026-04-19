"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLeadStore, type EnrichedLead } from "@/store/useLeadStore";
import { leadsToCSV, downloadCSV } from "@/lib/exportCsv";
import {
  Download, Globe, Mail, Phone, Table2, Target, ChevronRight,
  History, Search, Info, X, Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import CampaignHistory from "@/components/CampaignHistory";

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

type TierKey = "hot" | "warm" | "cold";

export default function LeadsTable() {
  const scoredLeads     = useLeadStore((s) => s.scoredLeads);
  const status          = useLeadStore((s) => s.status);
  const selectedLead    = useLeadStore((s) => s.selectedLead);
  const setSelectedLead = useLeadStore((s) => s.setSelectedLead);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [infoOpen,    setInfoOpen]    = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [tierFilter, setTierFilter] = useState<Record<TierKey, boolean>>({
    hot: true, warm: true, cold: true,
  });
  const [hasEmail,   setHasEmail]   = useState(false);
  const [hasPhone,   setHasPhone]   = useState(false);
  const [hasWebsite, setHasWebsite] = useState(false);
  const [minRating,  setMinRating]  = useState(0);

  const visibleLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoredLeads.filter((l) => {
      if (!tierFilter[l.tier]) return false;
      if (hasEmail   && !l.email)   return false;
      if (hasPhone   && !l.phone)   return false;
      if (hasWebsite && !l.website) return false;
      if (minRating > 0 && (l.rating ?? 0) < minRating) return false;
      if (q) {
        const hay = [l.name, l.email, l.website, l.address, l.platform]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scoredLeads, search, tierFilter, hasEmail, hasPhone, hasWebsite, minRating]);

  const filtersActive =
    search !== "" ||
    !tierFilter.hot || !tierFilter.warm || !tierFilter.cold ||
    hasEmail || hasPhone || hasWebsite || minRating > 0;

  function resetFilters() {
    setSearch("");
    setTierFilter({ hot: true, warm: true, cold: true });
    setHasEmail(false);
    setHasPhone(false);
    setHasWebsite(false);
    setMinRating(0);
  }

  function toggleTier(t: TierKey) {
    setTierFilter((prev) => ({ ...prev, [t]: !prev[t] }));
  }

  function handleExport() {
    const csv = leadsToCSV(visibleLeads);
    downloadCSV(csv, `leads_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="glass-panel flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-200">Lead Results</h2>
          {visibleLeads.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {visibleLeads.length}
              {filtersActive && scoredLeads.length !== visibleLeads.length && (
                <span className="text-zinc-500"> / {scoredLeads.length}</span>
              )}
            </span>
          )}
          <button
            onClick={() => setInfoOpen((v) => !v)}
            className="ml-1 p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-fuchsia-400 transition-colors"
            title="How tiers are scored"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {selectedLead && (
            <span className="text-[10px] text-zinc-500">Click a row to inspect · ESC to close</span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 bg-transparent border-white/20 hover:bg-white/10 hover:text-white"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-3.5 w-3.5" />
            History
          </Button>
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

      {/* Tier scoring explanation */}
      {infoOpen && (
        <div className="px-4 py-3 border-b border-white/10 bg-fuchsia-500/5 text-xs text-zinc-300 shrink-0">
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-fuchsia-400 mt-0.5 shrink-0" />
            <div className="space-y-1.5 leading-relaxed">
              <p className="font-medium text-white">How tiers are scored</p>
              <p>
                Each lead is classified by how many of{" "}
                <span className="font-medium text-zinc-100">email, phone, website</span> it has:
              </p>
              <ul className="space-y-0.5 ml-1">
                <li><Badge variant="outline" className={`${TIER_BADGE.hot.className} text-[10px] mr-1.5`}>Hot</Badge>all 3 present — ready for immediate outreach</li>
                <li><Badge variant="outline" className={`${TIER_BADGE.warm.className} text-[10px] mr-1.5`}>Warm</Badge>exactly 2 — one missing channel</li>
                <li><Badge variant="outline" className={`${TIER_BADGE.cold.className} text-[10px] mr-1.5`}>Cold</Badge>0 or 1 — needs enrichment before reaching out</li>
              </ul>
            </div>
            <button onClick={() => setInfoOpen(false)} className="ml-auto p-0.5 rounded text-zinc-500 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-black/20 shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, website..."
            className="w-full h-8 pl-7 pr-7 text-xs bg-white/5 border border-white/10 rounded-md text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Tier chips */}
        <div className="flex items-center gap-1">
          {(["hot", "warm", "cold"] as TierKey[]).map((t) => {
            const active = tierFilter[t];
            return (
              <button
                key={t}
                onClick={() => toggleTier(t)}
                className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded border transition-all ${
                  active ? TIER_BADGE[t].className : "bg-transparent border-white/10 text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {TIER_BADGE[t].label}
              </button>
            );
          })}
        </div>

        {/* Channel toggles */}
        <div className="flex items-center gap-1">
          {[
            { key: "email",   label: "Email",   state: hasEmail,   set: setHasEmail,   icon: Mail },
            { key: "phone",   label: "Phone",   state: hasPhone,   set: setHasPhone,   icon: Phone },
            { key: "website", label: "Website", state: hasWebsite, set: setHasWebsite, icon: Globe },
          ].map(({ key, label, state, set, icon: Icon }) => (
            <button
              key={key}
              onClick={() => set(!state)}
              className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border transition-all ${
                state
                  ? "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300"
                  : "bg-transparent border-white/10 text-zinc-500 hover:text-zinc-300"
              }`}
              title={`Only leads with ${label.toLowerCase()}`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Min rating */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Min ★</span>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="h-7 text-xs bg-white/5 border border-white/10 rounded px-1.5 text-zinc-300 focus:outline-none focus:border-fuchsia-500/50"
          >
            <option value={0}>Any</option>
            <option value={3}>3+</option>
            <option value={3.5}>3.5+</option>
            <option value={4}>4+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </div>

        {filtersActive && (
          <button
            onClick={resetFilters}
            className="ml-auto flex items-center gap-1 text-[10px] text-zinc-500 hover:text-fuchsia-400 transition-colors"
          >
            <Filter className="h-3 w-3" />
            Reset filters
          </button>
        )}
      </div>

      <CampaignHistory open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {/* Single scroll container — handles both axes */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="min-w-[800px]">
          {/* Column Headers — sticky at top while scrolling */}
          <div className="sticky top-0 z-10 grid grid-cols-[2fr_2fr_80px_3fr_20px] px-4 py-2.5 bg-black/80 backdrop-blur border-b border-white/10 text-xs font-medium text-zinc-400 uppercase tracking-wider">
            <span>Business Name</span>
            <span>Contact Info</span>
            <span>Tier</span>
            <span>AI Outreach Line</span>
            <span />
          </div>

          {/* Body */}
          <div>
            {visibleLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative w-24 h-24 rounded-full bg-[#1a1a24] border border-[#d946ef]/20 shadow-[0_0_30px_rgba(217,70,239,0.15)] flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border border-[#d946ef]/10 scale-110" />
                  <div className="absolute inset-0 rounded-full border border-[#d946ef]/5 scale-125" />
                  <Target className="h-12 w-12 text-[#d946ef] drop-shadow-[0_0_8px_rgba(217,70,239,0.5)] relative z-10" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {scoredLeads.length === 0 ? "No Leads Generated Yet" : "No Leads Match Filters"}
                </h3>
                <p className="text-sm text-zinc-400 mt-2 max-w-sm">
                  {scoredLeads.length === 0
                    ? "Configure your criteria on the left to start finding potential leads."
                    : "Try loosening the filters above or clear them to see all leads."}
                </p>
                {scoredLeads.length > 0 && filtersActive && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-xs text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-2"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {visibleLeads.map((lead, i) => {
                  const badge      = TIER_BADGE[lead.tier];
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
      </div>
    </div>
  );
}
