"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RequirementRule {
  id: string;
  label: string;
  test: (val: string) => boolean;
  getProgressText?: (val: string) => string;
}

const PASSWORD_RULES: RequirementRule[] = [
  {
    id: "length",
    label: "At least 15 characters",
    test: (val) => val.length >= 15,
    getProgressText: (val) => `${Math.min(val.length, 15)}/15`,
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (val) => /[a-z]/.test(val),
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (val) => /[A-Z]/.test(val),
  },
  {
    id: "number",
    label: "One number (0-9)",
    test: (val) => /\d/.test(val),
  },
  {
    id: "special",
    label: "One special character (!@#...)",
    test: (val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(val),
  },
];

interface PasswordRequirementsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function PasswordRequirements({ containerRef }: PasswordRequirementsProps) {
  const [password, setPassword] = React.useState<string>("");
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    let cleanupListeners: (() => void) | null = null;
    let observer: MutationObserver | null = null;

    const attach = () => {
      const root = containerRef.current;
      if (!root) return false;

      const pwdInput = root.querySelector('input[type="password"]') as HTMLInputElement | null;
      if (!pwdInput) return false;

      // Find the password field wrapper (.cl-formField)
      const formField = (pwdInput.closest(".cl-formField") || pwdInput.parentElement) as HTMLElement | null;
      if (!formField) return false;

      // Ensure a dedicated mounting slot element exists
      let slot = formField.querySelector(".pacia-password-requirements-slot") as HTMLElement | null;
      if (!slot) {
        slot = document.createElement("div");
        slot.className = "pacia-password-requirements-slot w-full mt-2";
        formField.appendChild(slot);
      }
      setPortalTarget(slot);

      // Read current value
      if (pwdInput.value) {
        setPassword(pwdInput.value);
      }

      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        setPassword(target.value || "");
      };

      pwdInput.addEventListener("input", handleInput);

      cleanupListeners = () => {
        pwdInput.removeEventListener("input", handleInput);
      };

      return true;
    };

    if (!attach()) {
      observer = new MutationObserver(() => {
        if (attach()) {
          observer?.disconnect();
        }
      });
      if (containerRef.current) {
        observer.observe(containerRef.current, { childList: true, subtree: true });
      }
    }

    return () => {
      cleanupListeners?.();
      observer?.disconnect();
    };
  }, [containerRef]);

  if (!portalTarget) {
    return null;
  }

  const results = PASSWORD_RULES.map((rule) => {
    const passed = rule.test(password);
    return {
      ...rule,
      passed,
      progress: rule.getProgressText ? rule.getProgressText(password) : null,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;
  const isAllValid = passedCount === PASSWORD_RULES.length;

  return createPortal(
    <div className="mt-2 bg-white p-3 text-xs ring-1 ring-zinc-200 transition-all duration-200">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          <ShieldCheck className={cn("h-3.5 w-3.5", isAllValid ? "text-[#15803d]" : "text-zinc-400")} />
          <span>Password requirements</span>
        </div>
        <span
          className={cn(
            "px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
            isAllValid
              ? "bg-[#15803d] text-white"
              : "bg-[#f4f4f2] text-zinc-500 ring-1 ring-zinc-200"
          )}
        >
          {passedCount}/{PASSWORD_RULES.length} met
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-3 gap-y-1 border-t border-zinc-100 pt-2 sm:grid-cols-2">
        {results.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-[11px] transition-colors py-0.5",
              rule.passed
                ? "text-[#14231d]"
                : "text-zinc-500"
            )}
          >
            {rule.passed ? (
              <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center bg-[#15803d] text-white">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 ring-1 ring-inset ring-zinc-300" />
            )}
            <span className="truncate">
              {rule.label}
              {rule.progress && !rule.passed && password.length > 0 && (
                <span className="ml-1 text-[10px] text-zinc-400">({rule.progress})</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>,
    portalTarget
  );
}
