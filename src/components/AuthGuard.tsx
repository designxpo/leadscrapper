"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Zap } from "lucide-react";

/**
 * Wraps protected pages. Shows a premium loading screen while checking auth,
 * then redirects to /login if not authenticated.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
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
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
