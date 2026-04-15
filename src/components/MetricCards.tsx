"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Flame, Thermometer } from "lucide-react";
import { useLeadStore } from "@/store/useLeadStore";

export default function MetricCards() {
  const scoredLeads = useLeadStore((s) => s.scoredLeads);
  const status      = useLeadStore((s) => s.status);

  const total = scoredLeads.length;
  const hot   = scoredLeads.filter((l) => l.tier === "hot").length;
  const warm  = scoredLeads.filter((l) => l.tier === "warm").length;

  const isProcessing = status === "scraping" || status === "enriching";

  const fmt = (n: number) => (total === 0 ? "—" : String(n));

  const metrics = [
    {
      title: "Total Leads",
      value: total === 0 ? "—" : String(total),
      icon: Users,
      description: "Scraped this session",
      color: "text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.6)]",
      bg: "bg-indigo-400/10 border border-indigo-400/30",
    },
    {
      title: "Hot",
      value: fmt(hot),
      icon: Flame,
      description: "Email + Phone + Website",
      color: "text-fuchsia-400 drop-shadow-[0_0_5px_rgba(232,121,249,0.8)]",
      bg: "bg-fuchsia-400/10 border border-fuchsia-400/40",
    },
    {
      title: "Warm",
      value: fmt(warm),
      icon: Thermometer,
      description: "Missing one contact field",
      color: "text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.6)]",
      bg: "bg-purple-400/10 border border-purple-400/30",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {metrics.map((m) => (
        <Card
          key={m.title}
          className={`glass-panel relative overflow-hidden transition-opacity ${
            isProcessing ? "opacity-60" : "opacity-100"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 tracking-wider">
              {m.title}
            </CardTitle>
            <div className={`p-2 rounded-md ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums text-white drop-shadow-md">{m.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
