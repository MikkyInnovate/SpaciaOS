"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Circle, ShieldCheck } from "lucide-react";
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
    <div className="rounded-md border border-stone-200/90 bg-stone-50/80 p-2 text-xs transition-all duration-200 shadow-2xs mt-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 font-medium text-stone-700 text-[11px]">
          <ShieldCheck className={cn("h-3.5 w-3.5", isAllValid ? "text-emerald-700" : "text-stone-500")} />
          <span>Password Requirements</span>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold px-1.5 py-0.2 rounded",
            isAllValid
              ? "bg-emerald-100 text-emerald-800"
              : "bg-stone-200/70 text-stone-600"
          )}
        >
          {passedCount}/{PASSWORD_RULES.length} met
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 pt-1 border-t border-stone-200/60">
        {results.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-[11px] transition-colors py-0.5",
              rule.passed
                ? "text-emerald-800 font-medium"
                : "text-stone-500"
            )}
          >
            {rule.passed ? (
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
            ) : (
              <Circle className="h-3.5 w-3.5 text-stone-300 stroke-[2] shrink-0" />
            )}
            <span className="truncate">
              {rule.label}
              {rule.progress && !rule.passed && password.length > 0 && (
                <span className="text-stone-400 ml-1 text-[10px]">({rule.progress})</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>,
    portalTarget
  );
}
