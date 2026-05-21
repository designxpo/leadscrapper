"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ROLES, goalsByRole, type Role, type Goal } from "@/config/onboardingConfig";

// ─── Step indicator ────────────────────────────────────────────────────────────

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? "w-8 bg-fuchsia-500"
              : i === current
              ? "w-8 bg-fuchsia-400"
              : "w-4 bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Role card ────────────────────────────────────────────────────────────────

function RoleCard({
  role,
  selected,
  onClick,
}: {
  role: Role;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-150 ${
        selected
          ? "border-fuchsia-500/60 bg-fuchsia-500/10 shadow-[0_0_16px_rgba(217,70,239,0.2)]"
          : "border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/5"
      }`}
    >
      <span className="text-2xl leading-none">{role.icon}</span>
      <div>
        <p className={`text-sm font-semibold ${selected ? "text-fuchsia-300" : "text-zinc-200"}`}>
          {role.label}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{role.description}</p>
      </div>
    </button>
  );
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  selected,
  onClick,
}: {
  goal: Goal;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-150 ${
        selected
          ? "border-fuchsia-500/60 bg-fuchsia-500/10 shadow-[0_0_16px_rgba(217,70,239,0.2)]"
          : "border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/5"
      }`}
    >
      <span className="text-2xl leading-none">{goal.icon}</span>
      <div>
        <p className={`text-sm font-semibold ${selected ? "text-fuchsia-300" : "text-zinc-200"}`}>
          {goal.label}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{goal.description}</p>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { session, refreshProfile } = useAuth();

  const [step, setStep]             = useState(0); // 0 = role, 1 = goal
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const goals = selectedRole ? goalsByRole(selectedRole.id) : [];

  async function saveAndRedirect(role: string | null, goalId: string | null, complete: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          role,
          goal_id: goalId,
          onboarding_complete: complete,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }
      await refreshProfile();
      router.replace("/");
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  function handleRoleSelect(role: Role) {
    setSelectedRole(role);
    setSelectedGoal(null); // reset goal when role changes
  }

  function handleContinue() {
    if (step === 0 && selectedRole) {
      setStep(1);
    }
  }

  function handleBack() {
    if (step === 1) {
      setStep(0);
      setSelectedGoal(null);
    }
  }

  function handleGetStarted() {
    if (!selectedRole || !selectedGoal) return;
    saveAndRedirect(selectedRole.id, selectedGoal.id, true);
  }

  function handleSkip() {
    saveAndRedirect(null, null, true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 mb-3 shadow-[0_0_24px_rgba(217,70,239,0.15)]">
            <Zap className="h-6 w-6 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]" />
          </div>
          <p className="text-sm text-zinc-500">LeadScrapper Pro</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          <Steps current={step} total={2} />

          {/* ── Step 0: Role ──────────────────────────────────────────────── */}
          {step === 0 && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  What describes you best?
                </h1>
                <p className="text-sm text-zinc-500 mt-1.5">
                  We&apos;ll personalize your dashboard based on how you use LeadScrapper.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {ROLES.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    selected={selectedRole?.id === role.id}
                    onClick={() => handleRoleSelect(role)}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-40"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!selectedRole || saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-fuchsia-500 text-white hover:bg-fuchsia-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_16px_rgba(217,70,239,0.3)]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* ── Step 1: Goal ──────────────────────────────────────────────── */}
          {step === 1 && selectedRole && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  What&apos;s your primary goal?
                </h1>
                <p className="text-sm text-zinc-500 mt-1.5">
                  As a{" "}
                  <span className="text-fuchsia-400 font-medium">
                    {selectedRole.icon} {selectedRole.label}
                  </span>
                  , what do you want to achieve?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    selected={selectedGoal?.id === goal.id}
                    onClick={() => setSelectedGoal(goal)}
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleGetStarted}
                  disabled={!selectedGoal || saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-fuchsia-500 text-white hover:bg-fuchsia-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_16px_rgba(217,70,239,0.3)]"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-5">
          You can always change this in your profile settings.
        </p>
      </div>
    </div>
  );
}
