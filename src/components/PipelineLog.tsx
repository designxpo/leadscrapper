"use client";

import { useEffect, useRef } from "react";
import { Terminal, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useLeadStore, type LogEntry } from "@/store/useLeadStore";

const TYPE_STYLES: Record<NonNullable<LogEntry["type"]>, string> = {
  info:    "text-zinc-400 opacity-90",
  success: "text-[#d946ef] font-bold drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]",
  warn:    "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]",
  error:   "text-red-500 font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]",
};

const TYPE_ICONS = {
  info:    <Info className="h-3 w-3 text-zinc-500 shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />,
  warn:    <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />,
  error:   <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />,
};

export default function PipelineLog() {
  const logs = useLeadStore((s) => s.logs);
  const status = useLeadStore((s) => s.status);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new log
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const isProcessing = status === "scraping" || status === "enriching";

  return (
    <div className="glass-panel flex flex-col h-full rounded-lg overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center gap-1.5 ml-1">
            <Terminal className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400 font-mono">pipeline.log</span>
          </div>
        </div>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          {status}
        </span>
      </div>

      {/* Log Body */}
      <div className="flex-1 bg-black/80 p-4 overflow-y-auto font-mono text-sm space-y-1 shadow-[inset_0_0_20px_rgba(57,255,20,0.05)]">
        {logs.map((log, i) => {
          const type = log.type ?? "info";
          return (
            <div key={i} className="flex items-start gap-2">
              {TYPE_ICONS[type]}
              <span className="text-zinc-600 shrink-0 select-none">&gt;&gt;</span>
              <span className={TYPE_STYLES[type]}>{log.msg}</span>
            </div>
          );
        })}

        {/* Blinking cursor while processing */}
        {isProcessing && (
          <div className="flex items-center gap-2 mt-1">
            <span className="w-3 h-3 shrink-0" />
            <span className="text-zinc-600 select-none">&gt;&gt;</span>
            <span className="text-[#d946ef] animate-pulse">▌</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
