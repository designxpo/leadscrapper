"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import type { RegistryField } from "@/config/scraperRegistry";

type Props = {
  field: RegistryField;
  value: string;
  onChange: (key: string, val: string) => void;
  disabled?: boolean;
  error?: string;
};

export function DynamicField({ field, value, onChange, disabled, error }: Props) {
  const hasError = Boolean(error);

  const baseClass = [
    "w-full text-xs bg-black/40 rounded-lg px-3 h-9 outline-none transition-colors",
    "disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-zinc-600",
    hasError
      ? "border border-rose-500/60 focus:border-rose-500 text-zinc-200"
      : "border border-white/10 focus:border-white/30 text-zinc-200",
  ].join(" ");

  const displayValue =
    value !== ""
      ? value
      : field.default !== undefined
      ? String(field.default)
      : "";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className={`text-xs ${hasError ? "text-rose-400" : "text-zinc-400"}`}>
          {field.label}
          {field.required && <span className="text-fuchsia-500 ml-0.5">*</span>}
        </Label>
        {hasError && (
          <span className="flex items-center gap-1 text-[10px] text-rose-400">
            <AlertCircle className="h-3 w-3" />
            {error}
          </span>
        )}
      </div>

      {field.type === "select" && field.options ? (
        <select
          value={displayValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          className={baseClass}
        >
          {field.options.map((opt) => {
            const val   = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={val} value={val} className="bg-zinc-900">
                {label}
              </option>
            );
          })}
        </select>
      ) : field.type === "password" ? (
        <Input
          type="password"
          placeholder={field.placeholder ?? ""}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          className={`font-mono text-xs h-9 bg-black/40 placeholder:text-zinc-600 ${
            hasError
              ? "border-rose-500/60 focus:border-rose-500 text-zinc-200"
              : "border-white/10 text-zinc-200"
          }`}
        />
      ) : field.type === "number" ? (
        <Input
          type="number"
          placeholder={field.placeholder ?? String(field.default ?? "")}
          value={displayValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          className={`text-xs h-9 bg-black/40 placeholder:text-zinc-600 ${
            hasError
              ? "border-rose-500/60 focus:border-rose-500 text-zinc-200"
              : "border-white/10 text-zinc-200"
          }`}
        />
      ) : (
        <Input
          type="text"
          placeholder={field.placeholder ?? ""}
          value={displayValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          className={`text-xs h-9 bg-black/40 placeholder:text-zinc-600 ${
            hasError
              ? "border-rose-500/60 focus:border-rose-500 text-zinc-200"
              : "border-white/10 text-zinc-200"
          }`}
        />
      )}

      {field.hint && !hasError && (
        <p className="text-[10px] text-zinc-600 leading-snug">{field.hint}</p>
      )}
    </div>
  );
}
