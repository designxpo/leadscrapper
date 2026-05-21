"use client";

import { useEffect, useRef } from "react";
import ConfigSidebar from "@/components/ConfigSidebar";
import PipelineLog from "@/components/PipelineLog";
import MetricCards from "@/components/MetricCards";
import LeadsTable from "@/components/LeadsTable";
import LeadDetailPanel from "@/components/LeadDetailPanel";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/components/AuthProvider";
import { useLeadStore } from "@/store/useLeadStore";

function Dashboard() {
  const { profile } = useAuth();
  const applyProfilePreset = useLeadStore((s) => s.applyProfilePreset);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    if (profile?.goal_id) {
      applyProfilePreset(profile.goal_id);
      applied.current = true;
    }
  }, [profile?.goal_id, applyProfilePreset]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-full bg-transparent text-foreground relative z-0 overflow-y-auto lg:overflow-hidden">
      <div className="w-full lg:w-1/3 lg:min-w-[340px] flex-shrink-0 h-[60vh] lg:h-full z-10 border-b border-white/10 lg:border-none">
        <ConfigSidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0 h-[80vh] lg:h-full overflow-hidden p-4 sm:p-6 gap-4 sm:gap-5">
        <div className="h-40 sm:h-48 flex-shrink-0">
          <PipelineLog />
        </div>
        <div className="flex-shrink-0">
          <MetricCards />
        </div>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <LeadsTable />
        </div>
      </div>
      <LeadDetailPanel />
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

