"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, Database, AlertCircle, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useLeadStore } from "@/store/useLeadStore";
import {
  SCRAPER_REGISTRY,
  SCRAPER_CATEGORIES,
  type RegistryField,
} from "@/config/scraperRegistry";
import { type Motive } from "@/config/motiveRegistry";
import { DynamicField } from "@/components/sidebar/DynamicField";
import { MotivePicker } from "@/components/sidebar/MotivePicker";
import { goalById, roleById } from "@/config/onboardingConfig";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPORT_TIERS = [
  { value: "all",      label: "All Leads"  },
  { value: "hot",      label: "Hot Only"   },
  { value: "hot_warm", label: "Hot & Warm" },
];

const STATUS_LABEL: Record<string, string> = {
  idle:      "Generate Leads",
  scraping:  "Scraping...",
  enriching: "Enriching...",
  exporting: "Exporting...",
  done:      "Generate Leads",
};

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-white/8" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
      {children}
    </label>
  );
}

// ─── PillSelector ─────────────────────────────────────────────────────────────

function PillSelector<T extends string>({
  options,
  active,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5 p-1 rounded-full border border-white/10 bg-black/40">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
            active === opt.value
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── StrategyCards ────────────────────────────────────────────────────────────

function StrategyCards({
  value,
  onChange,
  disabled,
}: {
  value: "strict" | "balanced" | "broad";
  onChange: (v: "strict" | "balanced" | "broad") => void;
  disabled?: boolean;
}) {
  const cards: {
    id: "strict" | "balanced" | "broad";
    title: string;
    desc: string;
    icon: string;
  }[] = [
    { id: "strict",   title: "Strict",   desc: "Hot leads only — full contact info",   icon: "🎯" },
    { id: "balanced", title: "Balanced", desc: "Hot & Warm — best volume/quality mix", icon: "⚖️" },
    { id: "broad",    title: "Broad",    desc: "All results — max reach",              icon: "🌐" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onChange(card.id)}
          disabled={disabled}
          className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
            value === card.id
              ? "border-white/40 bg-white/5 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
              : "border-white/10 bg-black/20 hover:border-white/20"
          }`}
        >
          <span className="text-base leading-none">{card.icon}</span>
          <span
            className={`text-xs font-semibold ${
              value === card.id ? "text-white" : "text-zinc-300"
            }`}
          >
            {card.title}
          </span>
          <span className="text-[10px] text-zinc-500 leading-tight">
            {card.desc}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── VolumeSlider ─────────────────────────────────────────────────────────────

function VolumeSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const bars = [2, 4, 8, 14, 22, 35, 45, 50, 42, 28, 15, 7, 3];
  const filledCount = Math.round((value / 1000) * bars.length);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-0.5 h-9 px-0.5">
        {bars.map((h, i) => (
          <div
            key={i}
            style={{ height: `${(h / 50) * 100}%` }}
            className={`flex-1 rounded-t-sm transition-colors duration-300 ${
              i < filledCount ? "bg-fuchsia-500/70" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <input
        type="range"
        min={5}
        max={1000}
        step={5}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-fuchsia-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      />
      <div className="flex gap-2 items-center">
        <div className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <div className="text-[10px] text-zinc-500 mb-0.5">Min</div>
          <div className="text-xs text-zinc-300 font-medium">0</div>
        </div>
        <div className="w-4 h-px bg-white/20" />
        <div className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <div className="text-[10px] text-zinc-500 mb-0.5">Max</div>
          <input
            type="number"
            value={value}
            min={5}
            max={1000}
            disabled={disabled}
            onChange={(e) =>
              onChange(Math.min(1000, Math.max(5, Number(e.target.value))))
            }
            className="text-xs text-zinc-200 font-medium bg-transparent border-none outline-none w-full disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function ConfigSidebar() {
  const { user, signOut } = useAuth();
  const {
    apiKey,          setApiKey,
    geminiApiKey,    setGeminiApiKey,
    newsApiKey,      setNewsApiKey,
    selectedSource,  setSelectedSource,
    dynamicPayload,  handlePayloadChange,
    maxResults,      setMaxResults,
    exportTier,      setExportTier,
    aiLines,         setAiLines,
    targetStrategy,  setTargetStrategy,
    minSignals,      setMinSignals,
    status,          generate,
  } = useLeadStore();

  const { profile } = useAuth();
  const userInitial = (user?.user_metadata?.full_name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();
  const userName = user?.user_metadata?.full_name || user?.email || "User";
  const userGoal = profile?.goal_id ? goalById(profile.goal_id) : null;
  const userRole = profile?.role ? roleById(profile.role) : null;

  // Per-field validation error messages, keyed by field.key
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [activeMotiveId, setActiveMotiveId] = useState<string | null>(null);

  const isProcessing =
    status === "scraping" || status === "enriching" || status === "exporting";

  const scraper = SCRAPER_REGISTRY[selectedSource];

  // ── handleGenerateClick ────────────────────────────────────────────────────
  // 1. Validates required fields and surfaces per-field errors.
  // 2. Builds the apifyKey-keyed payload the API expects.
  // 3. Calls generate() with that payload — no internal UI keys reach the server.

  function handleGenerateClick() {
    if (isProcessing || !scraper) return;

    // ── Step 1: Validate ────────────────────────────────────────────────────
    const errors: Record<string, string> = {};

    for (const field of scraper.inputs) {
      // maxResults is controlled by VolumeSlider — skip it here
      if (field.key === "maxResults") continue;

      const raw = dynamicPayload[field.key] ?? "";
      const isEmpty = raw.trim() === "";

      if (field.required && isEmpty) {
        errors[field.key] = "Required";
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // ── Step 2: Build apifyKey-keyed payload ────────────────────────────────
    // Keys in this object are the exact Apify actor input keys, not UI keys.
    const apifyPayload: Record<string, unknown> = {};

    for (const field of scraper.inputs) {
      // maxResults: resolve from VolumeSlider (store.maxResults), map to apifyKey
      if (field.key === "maxResults") {
        apifyPayload[field.apifyKey] = maxResults;
        continue;
      }

      const raw = dynamicPayload[field.key];
      // Use stored value; fall back to field default if blank
      let value: unknown =
        raw !== undefined && raw.trim() !== "" ? raw : field.default;

      if (value === undefined) continue;

      // Coerce number fields
      if (field.type === "number") {
        const n = Number(value);
        value = isFinite(n) ? n : field.default ?? 10;
      }

      // Split comma-separated text into arrays for list-type Apify keys
      if (
        field.type === "text" &&
        typeof value === "string" &&
        (field.apifyKey === "usernames" ||
          field.apifyKey === "queries" ||
          field.apifyKey === "searchStringsArray")
      ) {
        value = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      // Craigslist startUrls: wrap the URL string into the {url} object array.
      if (field.apifyKey === "startUrls" && field.key === "searchUrl" && typeof value === "string") {
        value = [{ url: value.trim() }];
      }

      // OLX India: UI-only keys (_area, _intent) are consumed here, not sent to the API.
      if (field.apifyKey === "_area" || field.apifyKey === "_intent") continue;
      if (field.apifyKey === "startUrls" && field.key === "olxCity" && typeof value === "string") {
        const area   = (dynamicPayload["olxArea"]   ?? "").trim().toLowerCase().replace(/\s+/g, "-");
        const intent = (dynamicPayload["olxIntent"] ?? "buy");
        // buy  → q-property-wanted / q-property-wanted-{area}
        // rent → q-property-for-rent / q-property-for-rent-{area}
        const baseQuery = intent === "rent" ? "property-for-rent" : "property-wanted";
        const query = area ? `${baseQuery}-${area}` : baseQuery;
        value = [{ url: `https://www.olx.in/${value}/q-${query}` }];
      }

      // MagicBricks / 99acres startUrls: wrap plain URL string into {url} object array.
      if (
        field.apifyKey === "startUrls" &&
        (field.key === "startUrl") &&
        typeof value === "string"
      ) {
        value = [{ url: value.trim() }];
      }

      apifyPayload[field.apifyKey] = value;
    }

    // ── Step 3: Fire ────────────────────────────────────────────────────────
    generate(apifyPayload);
  }

  // Clear field errors when source changes
  function handleSourceChange(id: string) {
    setSelectedSource(id);
    setFieldErrors({});
    setActiveMotiveId(null);
  }

  // Pick a high-level motive: auto-selects the right scraper and pre-fills query templates.
  function handleMotivePick(motive: Motive) {
    if (isProcessing) return;
    setActiveMotiveId(motive.id);
    setSelectedSource(motive.scraper);
    setFieldErrors({});
    // Apply prefill values so the relevant input fields are populated.
    for (const [key, value] of Object.entries(motive.prefill)) {
      handlePayloadChange(key, value);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <aside className="glass-sidebar w-full h-full flex flex-col text-zinc-200">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-fuchsia-400" />
            <span className="text-sm font-semibold text-white tracking-tight">
              LeadScrapper Pro
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Data Extraction Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_6px_rgba(217,70,239,0.8)]" />
        </div>
      </div>

      {/* ── User Bar ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-2.5 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-[0_0_10px_rgba(217,70,239,0.3)]">
            {userInitial}
          </div>
          <span className="text-xs text-zinc-400 truncate">{userName}</span>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-600 hover:text-rose-400 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Personalized goal banner ──────────────────────────────────────── */}
      {userGoal && userRole && (
        <div className="px-5 py-2 border-b border-white/5 flex items-center gap-2 bg-fuchsia-500/5">
          <span className="text-base leading-none">{userGoal.icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-fuchsia-300 truncate">
              {userGoal.label}
            </p>
            <p className="text-[9px] text-zinc-600 truncate">
              {userRole.icon} {userRole.label}
            </p>
          </div>
        </div>
      )}

      {/* ── Scrollable Form ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* ── 0. Goal / Motive ─────────────────────────────────────────────── */}
        <MotivePicker
          activeMotiveId={activeMotiveId}
          onPick={handleMotivePick}
          disabled={isProcessing}
        />

        <Divider />

        {/* ── 1. Data Source ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          <SectionLabel>
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3 inline" /> Data Source
            </span>
          </SectionLabel>

          <select
            value={selectedSource}
            onChange={(e) => handleSourceChange(e.target.value)}
            disabled={isProcessing}
            className="w-full text-xs bg-black/40 border border-white/10 text-zinc-200 rounded-lg px-3 h-9 outline-none focus:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {SCRAPER_CATEGORIES.map((cat) => (
              <optgroup key={cat} label={cat}>
                {Object.values(SCRAPER_REGISTRY)
                  .filter((s) => s.category === cat)
                  .map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>

          {scraper && (
            <p className="text-[10px] text-zinc-600 leading-snug">
              {scraper.category} · {scraper.apifyActorId}
            </p>
          )}
        </div>

        <Divider />

        {/* ── 2. API Keys ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <SectionLabel>API Keys</SectionLabel>

          {scraper?.provider === "direct" ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <span className="text-emerald-400 text-base leading-none">✓</span>
              <p className="text-[11px] text-emerald-400 leading-snug">
                No Apify key needed — this scraper fetches data directly.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Apify Key</Label>
              <Input
                type="password"
                placeholder="apify_api_••••••••••••"
                className="font-mono text-xs bg-black/40 border-white/10 text-zinc-200 placeholder:text-zinc-600 h-9"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          )}

          {aiLines && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Gemini Key</Label>
                <Input
                  type="password"
                  placeholder="AIza••••••••••••••••••••••"
                  className="font-mono text-xs bg-black/40 border-white/10 text-zinc-200 placeholder:text-zinc-600 h-9"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-[10px] text-zinc-600">
                  aistudio.google.com
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">
                  NewsAPI Key{" "}
                  <span className="text-zinc-600 font-normal">
                    (optional — adds news context)
                  </span>
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="font-mono text-xs bg-black/40 border-white/10 text-zinc-200 placeholder:text-zinc-600 h-9"
                  value={newsApiKey}
                  onChange={(e) => setNewsApiKey(e.target.value)}
                  disabled={isProcessing}
                />
                <p className="text-[10px] text-zinc-600">
                  newsapi.org/register — free tier: 100 req/day
                </p>
              </div>
            </>
          )}
        </div>

        <Divider />

        {/* ── 3. Dynamic Search Parameters ─────────────────────────────────── */}
        {scraper && (
          <div className="space-y-3">
            <SectionLabel>Search Parameters</SectionLabel>

            {scraper.inputs
              // maxResults is controlled by VolumeSlider below — exclude from loop
              .filter((f) => f.key !== "maxResults")
              .map((field: RegistryField) => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={dynamicPayload[field.key] ?? ""}
                  onChange={(key, val) => {
                    handlePayloadChange(key, val);
                    // Clear the error for this field as the user types
                    if (fieldErrors[key]) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }
                  }}
                  disabled={isProcessing}
                  error={fieldErrors[field.key]}
                />
              ))}
          </div>
        )}

        <Divider />

        {/* ── 4. Volume Target ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Volume Target</SectionLabel>
            <span className="text-xs font-bold text-fuchsia-400 tabular-nums">
              {maxResults} leads
            </span>
          </div>
          <VolumeSlider
            value={maxResults}
            onChange={setMaxResults}
            disabled={isProcessing}
          />
        </div>

        <Divider />

        {/* ── 5. Quality Strategy ───────────────────────────────────────────── */}
        <div>
          <SectionLabel>Quality Strategy</SectionLabel>
          <StrategyCards
            value={targetStrategy}
            onChange={setTargetStrategy}
            disabled={isProcessing}
          />
        </div>

        <Divider />

        {/* ── 6. Min Contact Signals ────────────────────────────────────────── */}
        <div>
          <SectionLabel>Min. Contact Signals</SectionLabel>
          <PillSelector
            options={[
              { value: "any", label: "Any" },
              { value: "1+",  label: "1+"  },
              { value: "2+",  label: "2+"  },
              { value: "3+",  label: "3+"  },
            ]}
            active={minSignals}
            onChange={setMinSignals}
            disabled={isProcessing}
          />
          <p className="text-[10px] text-zinc-600 mt-1.5">
            Minimum number of: email, phone, website
          </p>
        </div>

        <Divider />

        {/* ── 7. Export Filter ──────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Export Filter</SectionLabel>
          <PillSelector
            options={EXPORT_TIERS.map((t) => ({
              value: t.value as "all" | "hot" | "hot_warm",
              label: t.label,
            }))}
            active={exportTier as "all" | "hot" | "hot_warm"}
            onChange={setExportTier}
            disabled={isProcessing}
          />
        </div>

        <Divider />

        {/* ── 8. AI Lines ───────────────────────────────────────────────────── */}
        <div
          onClick={() => !isProcessing && setAiLines(!aiLines)}
          className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200 ${
            aiLines
              ? "border-fuchsia-500/40 bg-fuchsia-500/5 shadow-[0_0_12px_rgba(217,70,239,0.08)]"
              : "border-white/10 bg-black/20 hover:border-white/20"
          } ${isProcessing ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <div>
            <div
              className={`text-xs font-semibold ${
                aiLines ? "text-fuchsia-400" : "text-zinc-300"
              }`}
            >
              AI Personalized Lines
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Gemini outreach openers per lead
            </div>
          </div>
          <div
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
              aiLines ? "bg-fuchsia-500" : "bg-white/15"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-150 ${
                aiLines ? "left-[18px]" : "left-0.5"
              }`}
            />
          </div>
        </div>

      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-white/8">
        {/* Validation summary — shown when there are errors */}
        {Object.keys(fieldErrors).length > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-rose-400 mb-3">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Fill in all required fields above before generating.
          </p>
        )}

        <button
          onClick={handleGenerateClick}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl bg-fuchsia-500 text-white hover:bg-fuchsia-400 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_28px_rgba(217,70,239,0.45)]"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {STATUS_LABEL[status]}
        </button>
      </div>
    </aside>
  );
}
