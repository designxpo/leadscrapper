"use client";

import { useEffect, useState, useCallback } from "react";
import { useLeadStore, type EnrichedLead, type ResearchProfile } from "@/store/useLeadStore";
import { supabase } from "@/lib/supabase";
import { History, X, Trash2, Database, Loader2 } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  source: string;
  config: Record<string, unknown>;
  lead_count: number;
  created_at: string;
  status: string;
};

type DbLead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  source_url: string | null;
  extra_data: Record<string, unknown> | null;
  platform: string | null;
  description: string | null;
  budget: string | null;
  tier: "hot" | "warm" | "cold";
  ai_line: string | null;
};

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function CampaignHistory({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setScoredLeads = useLeadStore((s) => s.setScoredLeads);
  const pushLog        = useLeadStore((s) => s.pushLog);
  const clearLogs      = useLeadStore((s) => s.clearLogs);
  const setStatus      = useLeadStore((s) => s.setStatus);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load history");
      setCampaigns(data.campaigns ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchCampaigns();
  }, [open, fetchCampaigns]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function loadCampaign(c: Campaign) {
    setLoadingId(c.id);
    try {
      const res = await fetch(`/api/campaigns/${c.id}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load campaign");

      const leads: EnrichedLead[] = (data.leads as DbLead[]).map((l) => {
        const extra = l.extra_data ?? {};
        const profile = (extra as { profile?: ResearchProfile }).profile;
        return {
          name:        l.name,
          phone:       l.phone,
          email:       l.email,
          website:     l.website,
          address:     l.address,
          rating:      l.rating,
          source_url:  l.source_url,
          extra_data:  l.extra_data,
          platform:    l.platform,
          description: l.description,
          budget:      l.budget,
          tier:        l.tier,
          aiLine:      l.ai_line ?? undefined,
          profile,
        };
      });

      clearLogs();
      pushLog({ time: new Date().toLocaleTimeString("en-US", { hour12: false }), msg: `Restored campaign "${c.name}" (${leads.length} leads)`, type: "success" });
      setScoredLeads(leads);
      setStatus("done");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteCampaign(c: Campaign, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete campaign "${c.name}"? This removes all ${c.lead_count} leads.`)) return;
    try {
      const res = await fetch(`/api/campaigns/${c.id}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] z-50 flex flex-col bg-[#0e0e14] border-l border-white/10 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/8 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/20">
              <History className="h-4 w-4 text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Search History</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5">Past campaigns · click to restore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-500 text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-400">No saved campaigns yet</p>
              <p className="text-[10px] text-zinc-600 mt-1">Run a search to build history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => {
                const date = new Date(c.created_at).toLocaleString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                });
                const isLoading = loadingId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => loadCampaign(c)}
                    disabled={isLoading}
                    className="w-full text-left p-3 rounded-lg border border-white/8 bg-white/3 hover:bg-white/6 hover:border-fuchsia-500/30 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white">{c.name}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-zinc-400">
                            {c.source}
                          </span>
                          <span>·</span>
                          <span>{c.lead_count} leads</span>
                          <span>·</span>
                          <span>{date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-fuchsia-400" />}
                        <span
                          onClick={(e) => deleteCampaign(c, e)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
