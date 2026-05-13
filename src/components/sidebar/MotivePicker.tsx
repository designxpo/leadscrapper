"use client";

import { Target } from "lucide-react";
import { MOTIVES, type Motive } from "@/config/motiveRegistry";

type Props = {
  activeMotiveId: string | null;
  onPick: (motive: Motive) => void;
  disabled?: boolean;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
      {children}
    </label>
  );
}

export function MotivePicker({ activeMotiveId, onPick, disabled }: Props) {
  const activeMotive = MOTIVES.find((m) => m.id === activeMotiveId) ?? null;

  return (
    <div className="space-y-2">
      <SectionLabel>
        <span className="flex items-center gap-1.5">
          <Target className="h-3 w-3 inline" /> What&apos;s your goal?
        </span>
      </SectionLabel>

      <div className="grid grid-cols-2 gap-2">
        {MOTIVES.map((m) => {
          const active = activeMotiveId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onPick(m)}
              disabled={disabled}
              className={`flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                active
                  ? "border-fuchsia-500/50 bg-fuchsia-500/10 shadow-[0_0_10px_rgba(217,70,239,0.15)]"
                  : "border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/5"
              }`}
            >
              <span className="text-base leading-none">{m.icon}</span>
              <span className={`text-[11px] font-semibold leading-tight ${active ? "text-fuchsia-300" : "text-zinc-200"}`}>
                {m.label}
              </span>
              <span className="text-[9px] text-zinc-500 leading-snug">
                {m.description}
              </span>
            </button>
          );
        })}
      </div>

      {activeMotive && (
        <div className="rounded-lg border border-fuchsia-500/15 bg-fuchsia-500/5 px-3 py-2 text-[10px] text-zinc-400 leading-relaxed">
          <span className="font-medium text-fuchsia-300">Tip:</span> {activeMotive.hint}
        </div>
      )}
    </div>
  );
}
