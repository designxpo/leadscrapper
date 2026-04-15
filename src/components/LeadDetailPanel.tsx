"use client";

import { useEffect } from "react";
import { useLeadStore, type EnrichedLead } from "@/store/useLeadStore";
import { Badge } from "@/components/ui/badge";
import {
  X, Globe, Mail, Phone, MapPin, Star, Briefcase,
  Calendar, DollarSign, Newspaper, ExternalLink, Sparkles,
} from "lucide-react";

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
        className={`fixed top-0 right-0 h-full w-[420px] z-50 flex flex-col bg-[#0e0e14] border-l border-white/10 transition-transform duration-300 ease-out ${
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
