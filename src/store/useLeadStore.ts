import { create } from "zustand";
import type { RawLead } from "@/app/api/scrape/route";
import type { NewsArticle } from "@/app/api/news/route";
import { scoreLeads, type ScoredLead } from "@/lib/scoreLead";
import { SCRAPER_REGISTRY } from "@/config/scraperRegistry";

export type { RawLead, ScoredLead };

export type ProcessingStatus = "idle" | "scraping" | "enriching" | "exporting" | "done";

export type LogEntry = {
  time: string;
  msg: string;
  type?: "info" | "success" | "warn" | "error";
};

export type EnrichedLead = ScoredLead & {
  articles?: NewsArticle[];
};

type LeadStore = {
  // ── API Keys ──────────────────────────────────────────────────────────────
  apiKey: string;
  geminiApiKey: string;
  newsApiKey: string;

  // ── Scraper selection ─────────────────────────────────────────────────────
  selectedSource: string;                      // key into SCRAPER_REGISTRY
  dynamicPayload: Record<string, string>;      // keyed by RegistryField.key

  // ── Shared targeting ──────────────────────────────────────────────────────
  maxResults: number;
  countryCode: string;
  stateCode: string;

  // ── Output / quality ─────────────────────────────────────────────────────
  exportTier: string;
  aiLines: boolean;
  leadType: "companies" | "projects";
  targetStrategy: "strict" | "balanced" | "broad";
  minSignals: "any" | "1+" | "2+" | "3+";

  // ── Pipeline state ────────────────────────────────────────────────────────
  status: ProcessingStatus;
  logs: LogEntry[];
  rawLeads: RawLead[];
  scoredLeads: EnrichedLead[];
  selectedLead: EnrichedLead | null;

  // ── Setters ───────────────────────────────────────────────────────────────
  setApiKey: (v: string) => void;
  setGeminiApiKey: (v: string) => void;
  setNewsApiKey: (v: string) => void;
  setSelectedSource: (v: string) => void;
  handlePayloadChange: (key: string, value: string) => void;
  setMaxResults: (v: number) => void;
  setCountryCode: (v: string) => void;
  setStateCode: (v: string) => void;
  setExportTier: (v: string) => void;
  setAiLines: (v: boolean) => void;
  setLeadType: (v: "companies" | "projects") => void;
  setTargetStrategy: (v: "strict" | "balanced" | "broad") => void;
  setMinSignals: (v: "any" | "1+" | "2+" | "3+") => void;

  // ── Pipeline actions ──────────────────────────────────────────────────────
  setStatus: (s: ProcessingStatus) => void;
  pushLog: (entry: LogEntry) => void;
  clearLogs: () => void;
  setRawLeads: (leads: RawLead[]) => void;
  setScoredLeads: (leads: EnrichedLead[]) => void;
  setSelectedLead: (lead: EnrichedLead | null) => void;

  // ── Orchestrator ──────────────────────────────────────────────────────────
  // apifyPayload: already keyed by apifyKey, built and validated by the sidebar
  generate: (apifyPayload: Record<string, unknown>) => Promise<void>;
};

export function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export const useLeadStore = create<LeadStore>((set, get) => ({
  // Defaults
  apiKey: "",
  geminiApiKey: "",
  newsApiKey: "",

  selectedSource: "google_maps",
  dynamicPayload: {},

  maxResults: 100,
  countryCode: "US",
  stateCode: "",

  exportTier: "hot_warm",
  aiLines: false,
  leadType: "companies",
  targetStrategy: "balanced",
  minSignals: "2+",

  status: "idle",
  logs: [
    { time: "00:00:00", msg: "System ready. Configure your search and click Generate Leads.", type: "info" },
  ],
  rawLeads: [],
  scoredLeads: [],
  selectedLead: null,

  // Setters
  setApiKey:       (v) => set({ apiKey: v }),
  setGeminiApiKey: (v) => set({ geminiApiKey: v }),
  setNewsApiKey:   (v) => set({ newsApiKey: v }),

  setSelectedSource: (v) =>
    set({ selectedSource: v, dynamicPayload: {} }),   // reset payload on source switch

  handlePayloadChange: (key, value) =>
    set((state) => ({
      dynamicPayload: { ...state.dynamicPayload, [key]: value },
    })),

  setMaxResults:     (v) => set({ maxResults: v }),
  setCountryCode:    (v) => set({ countryCode: v, stateCode: "" }),
  setStateCode:      (v) => set({ stateCode: v }),
  setExportTier:     (v) => set({ exportTier: v }),
  setAiLines:        (v) => set({ aiLines: v }),
  setLeadType:       (v) => set({ leadType: v }),
  setTargetStrategy: (v) => set({ targetStrategy: v }),
  setMinSignals:     (v) => set({ minSignals: v }),

  setStatus:       (s) => set({ status: s }),
  pushLog:         (entry) => set((state) => ({ logs: [...state.logs, entry] })),
  clearLogs:       () => set({ logs: [] }),
  setRawLeads:     (leads) => set({ rawLeads: leads }),
  setScoredLeads:  (leads) => set({ scoredLeads: leads }),
  setSelectedLead: (lead) => set({ selectedLead: lead }),

  generate: async (apifyPayload) => {
    const {
      apiKey, geminiApiKey, newsApiKey,
      selectedSource,
      aiLines, targetStrategy, minSignals,
      pushLog, setStatus, setRawLeads, setScoredLeads,
    } = get();

    const scraper = SCRAPER_REGISTRY[selectedSource];

    // ── Reset ──────────────────────────────────────────────────────────────
    set({ logs: [], rawLeads: [], scoredLeads: [], selectedLead: null });
    setStatus("scraping");

    pushLog({ time: timestamp(), msg: `Source: ${scraper.name} (${scraper.apifyActorId})`, type: "info" });
    pushLog({ time: timestamp(), msg: "Actor started. This may take up to 2 minutes...", type: "info" });

    // ── Phase 1: Scrape ───────────────────────────────────────────────────
    // apifyPayload is already keyed by apifyKey — no transformation needed here.
    let rawLeads: RawLead[] = [];
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          actorId: scraper.apifyActorId,
          payload: apifyPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushLog({ time: timestamp(), msg: `Scrape error: ${data.error ?? "Unknown error"}`, type: "error" });
        setStatus("idle");
        return;
      }
      rawLeads = data.leads as RawLead[];
      pushLog({ time: timestamp(), msg: `Scraping complete. ${rawLeads.length} raw leads collected.`, type: "success" });
    } catch (err: unknown) {
      pushLog({ time: timestamp(), msg: `Network error: ${err instanceof Error ? err.message : String(err)}`, type: "error" });
      setStatus("idle");
      return;
    }

    setRawLeads(rawLeads);

    // ── Phase 2: Score + Filter ───────────────────────────────────────────
    setStatus("enriching");
    pushLog({ time: timestamp(), msg: "Scoring leads: Hot / Warm / Cold...", type: "info" });

    let scored: EnrichedLead[] = scoreLeads(rawLeads);

    const minCount = minSignals === "any" ? 0 : minSignals === "1+" ? 1 : minSignals === "2+" ? 2 : 3;
    if (minCount > 0) {
      scored = scored.filter((l) => [l.email, l.phone, l.website].filter(Boolean).length >= minCount);
    }
    if (targetStrategy === "strict") {
      scored = scored.filter((l) => l.tier === "hot");
    } else if (targetStrategy === "balanced") {
      scored = scored.filter((l) => l.tier === "hot" || l.tier === "warm");
    }

    const hot  = scored.filter((l) => l.tier === "hot").length;
    const warm = scored.filter((l) => l.tier === "warm").length;
    const cold = scored.filter((l) => l.tier === "cold").length;

    pushLog({ time: timestamp(), msg: `Strategy: ${targetStrategy} · ${minSignals} signals → ${scored.length} qualified leads`, type: "info" });
    pushLog({ time: timestamp(), msg: `Identified ${hot} Hot, ${warm} Warm, ${cold} Cold leads.`, type: "success" });

    // ── Phase 3: News + AI enrichment ─────────────────────────────────────
    if (aiLines && geminiApiKey) {
      const targets = scored.filter((l) => l.tier === "hot" || l.tier === "warm");
      const hasNews = Boolean(newsApiKey);

      pushLog({
        time: timestamp(),
        msg: `Generating AI lines for ${targets.length} leads${hasNews ? " with news context" : ""}...`,
        type: "info",
      });

      let done = 0;

      const enriched: EnrichedLead[] = await Promise.all(
        scored.map(async (lead) => {
          if (lead.tier !== "hot" && lead.tier !== "warm") return lead;

          let articles: NewsArticle[] = [];
          if (hasNews) {
            try {
              const nr = await fetch("/api/news", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyName: lead.name, newsApiKey }),
              });
              const nd = await nr.json();
              articles = nd.articles ?? [];
            } catch {
              // news is optional — silently skip
            }
          }

          try {
            const er = await fetch("/api/enrich", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lead, geminiApiKey, articles }),
            });
            const ed = await er.json();
            done++;
            if (done % 5 === 0 || done === targets.length) {
              pushLog({ time: timestamp(), msg: `AI lines generated: ${done}/${targets.length}`, type: "info" });
            }
            return { ...lead, aiLine: ed.aiLine ?? "", articles };
          } catch {
            return { ...lead, articles };
          }
        })
      );

      scored = enriched;
      pushLog({ time: timestamp(), msg: "AI personalization complete.", type: "success" });
    } else if (aiLines && !geminiApiKey) {
      pushLog({ time: timestamp(), msg: "AI Lines skipped — Gemini API key not provided.", type: "warn" });
    }

    setScoredLeads(scored);

    // ── Phase 4: Persist to Supabase as a Campaign ──────────────────────────
    pushLog({ time: timestamp(), msg: "Saving campaign to database...", type: "info" });

    try {
      const campaignName = `${scraper.name} — ${new Date().toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })}`;

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:   campaignName,
          source: selectedSource,
          config: apifyPayload,
          leads:  scored.map((l) => ({
            name:        l.name,
            phone:       l.phone,
            email:       l.email,
            website:     l.website,
            address:     l.address,
            rating:      l.rating,
            source_url:  l.source_url ?? null,
            extra_data:  l.extra_data ?? null,
            platform:    l.platform ?? null,
            description: l.description ?? null,
            budget:      l.budget ?? null,
            tier:        l.tier,
            ai_line:     l.aiLine ?? null,
          })),
        }),
      });

      if (res.ok) {
        const { campaign } = await res.json();
        pushLog({ time: timestamp(), msg: `Campaign saved: "${campaign.name}" (${scored.length} leads)`, type: "success" });
      } else {
        const err = await res.json().catch(() => ({}));
        pushLog({ time: timestamp(), msg: `Campaign save failed: ${err.error ?? res.statusText}`, type: "warn" });
      }
    } catch (err: unknown) {
      pushLog({ time: timestamp(), msg: `Campaign save error: ${err instanceof Error ? err.message : String(err)}`, type: "warn" });
    }

    pushLog({ time: timestamp(), msg: "All leads ready.", type: "success" });
    setStatus("done");
  },
}));
