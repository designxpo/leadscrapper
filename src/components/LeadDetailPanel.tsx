"use client";

import { useEffect } from "react";
import { useLeadStore, type EnrichedLead } from "@/store/useLeadStore";
import { Badge } from "@/components/ui/badge";
import {
  X, Globe, Mail, Phone, MapPin, Star, Briefcase,
  Calendar, DollarSign, Newspaper, ExternalLink, Sparkles,
  User, Building2, Globe2, Target, TrendingUp, Flag,
} from "lucide-react";
import type { ResearchProfile } from "@/app/api/enrich/route";

const TIER_STYLES = {
  hot:  { label: "HOT",  badge: "bg-rose-500/20 text-rose-400 border-rose-500/40", glow: "shadow-[0_0_20px_rgba(251,113,133,0.15)]" },
  warm: { label: "WARM", badge: "bg-amber-500/20 text-amber-400 border-amber-500/40", glow: "shadow-[0_0_20px_rgba(251,191,36,0.12)]" },
  cold: { label: "COLD", badge: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40", glow: "" },
};

function Row({ icon: Icon, label, value, href }: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 group">
      <div className="mt-0.5 p-1.5 rounded-md bg-white/5 shrink-0">
        <Icon className="h-3.5 w-3.5 text-zinc-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mb-0.5">{label}</div>
        <div className={`text-xs text-zinc-200 break-all ${href ? "group-hover:text-fuchsia-400 transition-colors" : ""}`}>
          {value}
        </div>
      </div>
      {href && <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-fuchsia-400 mt-1 shrink-0 transition-colors" />}
    </div>
  );

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : content;
}

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full  }).map((_, i) => <Star key={`f${i}`} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
      {half && <Star className="h-3.5 w-3.5 fill-yellow-400/50 text-yellow-400" />}
      {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} className="h-3.5 w-3.5 text-zinc-600" />)}
      <span className="text-xs text-zinc-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function NewsCard({ article, index }: { article: { title: string; description: string | null; url: string; publishedAt: string; source: string }; index: number }) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all group"
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span className="text-[10px] font-bold text-fuchsia-500/70 shrink-0 mt-0.5">#{index + 1}</span>
        <p className="text-xs font-medium text-zinc-200 leading-snug group-hover:text-white transition-colors line-clamp-2">
          {article.title}
        </p>
      </div>
      {article.description && (
        <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 ml-4">{article.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2 ml-4">
        <span className="text-[10px] text-zinc-600 font-medium">{article.source}</span>
        {date && <span className="text-[10px] text-zinc-700">· {date}</span>}
        <ExternalLink className="h-2.5 w-2.5 text-zinc-700 ml-auto" />
      </div>
    </a>
  );
}

export default function LeadDetailPanel() {
  const lead        = useLeadStore((s) => s.selectedLead);
  const setSelected = useLeadStore((s) => s.setSelectedLead);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSelected]);

  const isOpen = Boolean(lead);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setSelected(null)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 flex flex-col bg-[#0e0e14] border-l border-white/10 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {lead && <PanelContent lead={lead} onClose={() => setSelected(null)} />}
      </div>
    </>
  );
}

function PanelContent({ lead, onClose }: { lead: EnrichedLead; onClose: () => void }) {
  const tier = TIER_STYLES[lead.tier];

  return (
    <>
      {/* Header */}
      <div className={`px-5 pt-5 pb-4 border-b border-white/8 ${tier.glow}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white leading-tight truncate">{lead.name}</h2>
            {lead.address && (
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />{lead.address}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-[10px] font-bold tracking-wider ${tier.badge}`}>
              {tier.label}
            </Badge>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {lead.rating != null && <StarRating rating={lead.rating} />}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Contact Hierarchy */}
        <section>
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1">Contact Info</p>
          {lead.phone   && <Row icon={Phone}  label="Phone"   value={lead.phone}   href={`tel:${lead.phone}`} />}
          {lead.email   && <Row icon={Mail}   label="Email"   value={lead.email}   href={`mailto:${lead.email}`} />}
          {lead.website && <Row icon={Globe}  label="Website" value={lead.website} href={lead.website} />}
          {lead.address && <Row icon={MapPin} label="Address" value={lead.address} />}
          {!lead.phone && !lead.email && !lead.website && (
            <p className="text-xs text-zinc-600 italic py-2">No contact details available.</p>
          )}
        </section>

        {/* Project-mode extras */}
        {(lead.platform || lead.budget || lead.postedAt || lead.description) && (
          <section>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1">Project Details</p>
            {lead.platform    && <Row icon={Briefcase} label="Platform"  value={lead.platform} />}
            {lead.budget      && <Row icon={DollarSign} label="Budget"   value={lead.budget} />}
            {lead.postedAt    && <Row icon={Calendar}  label="Posted"    value={new Date(lead.postedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />}
            {lead.description && <Row icon={Briefcase} label="Description" value={lead.description} />}
          </section>
        )}

        {/* AI Outreach Line */}
        {lead.aiLine && (
          <section>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">AI Outreach Opener</p>
            <div className="relative rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-4 py-3">
              <Sparkles className="absolute top-3 right-3 h-3.5 w-3.5 text-fuchsia-500/50" />
              <p className="text-xs text-zinc-200 leading-relaxed pr-5">{lead.aiLine}</p>
            </div>
          </section>
        )}

        {/* Research Profile — 7-section B2B qualification */}
        {lead.profile && <ProfileSections profile={lead.profile} />}

        {/* News Articles */}
        {lead.articles && lead.articles.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Newspaper className="h-3 w-3" /> Recent News
            </p>
            <div className="space-y-2">
              {lead.articles.map((article, i) => (
                <NewsCard key={i} article={article} index={i} />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-white/8 flex gap-2">
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </a>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
        )}
        {lead.website && (
          <a
            href={lead.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" /> Website
          </a>
        )}
      </div>
    </>
  );
}

// ─── Research profile rendering ──────────────────────────────────────────────

const DASH = "—";

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "" || v.trim() === DASH;
  if (typeof v === "number") return v === 0;
  return false;
}

function ConfidencePill({ level }: { level?: "High" | "Medium" | "Low" }) {
  if (!level) return null;
  const styles = {
    High:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Medium: "bg-amber-500/15  text-amber-400   border-amber-500/30",
    Low:    "bg-rose-500/15   text-rose-400    border-rose-500/30",
  }[level];
  return (
    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${styles}`}>
      {level}
    </span>
  );
}

function ProfileRow({
  label, value, keyPath, confidence, verifyFlags,
}: {
  label: string;
  value: string | number;
  keyPath: string;
  confidence: Record<string, "High" | "Medium" | "Low">;
  verifyFlags: string[];
}) {
  if (isEmpty(value)) return null;
  const needsVerify = verifyFlags.includes(keyPath);
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider shrink-0 pt-0.5">
        {label}
      </span>
      <div className="flex items-center gap-1.5 text-right min-w-0 flex-1 justify-end">
        <span className="text-xs text-zinc-200 break-words">{String(value)}</span>
        {needsVerify && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 shrink-0">
            Verify
          </span>
        )}
        <ConfidencePill level={confidence[keyPath]} />
      </div>
    </div>
  );
}

function ProfileBlock({
  title, icon: Icon, rows, keyPrefix, confidence, verifyFlags,
}: {
  title: string;
  icon: React.ElementType;
  rows: { label: string; key: string; value: string | number }[];
  keyPrefix: string;
  confidence: Record<string, "High" | "Medium" | "Low">;
  verifyFlags: string[];
}) {
  const nonEmpty = rows.filter((r) => !isEmpty(r.value));
  if (nonEmpty.length === 0) return null;
  return (
    <section>
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {title}
      </p>
      <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-1.5">
        {nonEmpty.map((r) => (
          <ProfileRow
            key={r.key}
            label={r.label}
            value={r.value}
            keyPath={`${keyPrefix}.${r.key}`}
            confidence={confidence}
            verifyFlags={verifyFlags}
          />
        ))}
      </div>
    </section>
  );
}

function ProfileSections({ profile }: { profile: ResearchProfile }) {
  const cf = profile.confidence ?? {};
  const vf = profile.verify_flags ?? [];

  const icp = profile.quality?.icp_match_score ?? 0;
  const icpBadge = icp >= 4
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : icp >= 3
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-rose-500/15 text-rose-400 border-rose-500/30";

  return (
    <>
      {icp > 0 && (
        <section>
          <div className={`rounded-lg border px-3 py-2 flex items-center justify-between ${icpBadge}`}>
            <span className="text-[10px] font-semibold uppercase tracking-widest">ICP Match</span>
            <span className="text-base font-bold">{icp}/5</span>
          </div>
        </section>
      )}

      <ProfileBlock
        title="Identity" icon={User} keyPrefix="identity"
        confidence={cf} verifyFlags={vf}
        rows={[
          { label: "Full Name",    key: "full_name",    value: profile.identity.full_name },
          { label: "Job Title",    key: "job_title",    value: profile.identity.job_title },
          { label: "Seniority",    key: "seniority",    value: profile.identity.seniority },
          { label: "Department",   key: "department",   value: profile.identity.department },
          { label: "LinkedIn",     key: "linkedin_url", value: profile.identity.linkedin_url },
        ]}
      />

      <ProfileBlock
        title="Company" icon={Building2} keyPrefix="company"
        confidence={cf} verifyFlags={vf}
        rows={[
          { label: "Name",       key: "name",             value: profile.company.name },
          { label: "Website",    key: "website",          value: profile.company.website },
          { label: "Industry",   key: "industry",         value: profile.company.industry },
          { label: "Size",       key: "size",             value: profile.company.size },
          { label: "Revenue",    key: "revenue_estimate", value: profile.company.revenue_estimate },
          { label: "Funding",    key: "funding_stage",    value: profile.company.funding_stage },
        ]}
      />

      <ProfileBlock
        title="Geography" icon={Globe2} keyPrefix="geography"
        confidence={cf} verifyFlags={vf}
        rows={[
          { label: "City/Region", key: "city_region", value: profile.geography.city_region },
          { label: "Country",     key: "country",     value: profile.geography.country },
          { label: "Timezone",    key: "timezone",    value: profile.geography.timezone },
          { label: "Language",    key: "language",    value: profile.geography.language },
          { label: "Market",      key: "market_type", value: profile.geography.market_type },
        ]}
      />

      <ProfileBlock
        title="Contact" icon={Phone} keyPrefix="contact"
        confidence={cf} verifyFlags={vf}
        rows={[
          { label: "Work Email",     key: "work_email",         value: profile.contact.work_email },
          { label: "Verified",       key: "email_verified",     value: profile.contact.email_verified },
          { label: "Phone/WhatsApp", key: "phone_whatsapp",     value: profile.contact.phone_whatsapp },
          { label: "Channel",        key: "preferred_channel",  value: profile.contact.preferred_channel },
          { label: "Best Time",      key: "best_contact_time",  value: profile.contact.best_contact_time },
        ]}
      />

      <ProfileBlock
        title="Lead Quality" icon={Target} keyPrefix="quality"
        confidence={cf} verifyFlags={vf}
        rows={[
          { label: "Source",        key: "lead_source",   value: profile.quality.lead_source },
          { label: "Pain Point",    key: "pain_point",    value: profile.quality.pain_point },
          { label: "Competitor",    key: "competitor",    value: profile.quality.competitor },
          { label: "Intent Signal", key: "intent_signal", value: profile.quality.intent_signal },
        ]}
      />

      <ProfileBlock
        title="Outreach" icon={Flag} keyPrefix="outreach"
        confidence={cf} verifyFlags={vf}
        rows={[
          { label: "Status",       key: "status",          value: profile.outreach.status },
          { label: "Last Contact", key: "last_contact",    value: profile.outreach.last_contact },
          { label: "Follow-up",    key: "follow_up_date",  value: profile.outreach.follow_up_date },
          { label: "Sequence",     key: "sequence",        value: profile.outreach.sequence },
          { label: "Touches",      key: "touch_count",     value: profile.outreach.touch_count },
          { label: "Notes",        key: "response_notes",  value: profile.outreach.response_notes },
        ]}
      />

      <ProfileBlock
        title="Pipeline" icon={TrendingUp} keyPrefix="pipeline"
        confidence={cf} verifyFlags={vf}
        rows={[
          { label: "Stage",     key: "stage",                value: profile.pipeline.stage },
          { label: "Deal Est.", key: "deal_value_estimate",  value: profile.pipeline.deal_value_estimate },
          { label: "Currency",  key: "currency",             value: profile.pipeline.currency },
          { label: "Timeline",  key: "decision_timeline",    value: profile.pipeline.decision_timeline },
          { label: "Owner",     key: "owner",                value: profile.pipeline.owner },
        ]}
      />
    </>
  );
}
