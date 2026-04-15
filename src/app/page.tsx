import ConfigSidebar from "@/components/ConfigSidebar";
import PipelineLog from "@/components/PipelineLog";
import MetricCards from "@/components/MetricCards";
import LeadsTable from "@/components/LeadsTable";
import LeadDetailPanel from "@/components/LeadDetailPanel";

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent text-foreground relative z-0">
      {/* Subtle overlays can go here if needed, but globals.css handles the gradient */}
      
      {/* Left Column — Configuration Sidebar (w-1/3) */}
      <div className="w-1/3 min-w-[340px] flex-shrink-0 h-full z-10">
        <ConfigSidebar />
      </div>

      {/* Right Column — Dashboard (w-2/3) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5">
        {/* Pipeline Log Terminal */}
        <div className="h-48 flex-shrink-0">
          <PipelineLog />
        </div>

        {/* Metric Cards */}
        <MetricCards />

        {/* Leads Table */}
        <LeadsTable />
      </div>

      {/* Detail slide-in panel — rendered at root level so it overlays everything */}
      <LeadDetailPanel />
    </div>
  );
}
