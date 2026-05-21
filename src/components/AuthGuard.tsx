"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Zap } from "lucide-react";

function Spinner({ label }: { label: string }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#141416] gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-fuchsia-500/10 blur-xl animate-pulse" />
        <div className="relative w-14 h-14 flex items-center justify-center rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20">
          <Zap className="h-7 w-7 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

/**
 * Wraps protected pages.
 * - Redirects unauthenticated users to /login.
 * - Redirects authenticated users who haven't finished onboarding to /onboarding.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, profile, profileLoading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Don't redirect if already on the onboarding page (avoids loops).
    if (pathname === "/onboarding") return;

    if (profile && !profile.onboarding_complete) {
      router.replace("/onboarding");
    }
  }, [loading, profileLoading, user, profile, pathname, router]);

  if (loading || profileLoading) {
    return <Spinner label="Loading dashboard…" />;
  }

  if (!user) return null;

  // Still show spinner while profile redirects (prevents a flash of the dashboard)
  if (profile && !profile.onboarding_complete && pathname !== "/onboarding") {
    return <Spinner label="Setting up your dashboard…" />;
  }

  return <>{children}</>;
}
