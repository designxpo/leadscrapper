"use client";

import ConfigSidebar from "@/components/ConfigSidebar";
import PipelineLog from "@/components/PipelineLog";
import MetricCards from "@/components/MetricCards";
import LeadsTable from "@/components/LeadsTable";
import LeadDetailPanel from "@/components/LeadDetailPanel";
import AuthGuard from "@/components/AuthGuard";

export default function Home() {
  return (
    <AuthGuard>
      <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen w-full bg-transparent text-foreground relative z-0 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Column — Configuration Sidebar (w-1/3) */}
        <div className="w-full lg:w-1/3 lg:min-w-[340px] flex-shrink-0 h-[60vh] lg:h-full z-10 border-b border-white/10 lg:border-none">
          <ConfigSidebar />
        </div>

        {/* Right Column — Dashboard (w-2/3) */}
        <div className="flex-1 flex flex-col h-[80vh] lg:h-full overflow-hidden p-4 sm:p-6 gap-4 sm:gap-5">
          {/* Pipeline Log Terminal */}
          <div className="h-40 sm:h-48 flex-shrink-0">
            <PipelineLog />
          </div>

          {/* Metric Cards */}
          <div className="flex-shrink-0">
            <MetricCards />
          </div>

          {/* Leads Table */}
          <div className="flex-1 overflow-hidden">
            <LeadsTable />
          </div>
        </div>

        {/* Detail slide-in panel */}
        <LeadDetailPanel />
      </div>
    </AuthGuard>
  );
}

