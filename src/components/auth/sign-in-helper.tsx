"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { AlertCircle, ArrowRight, X, KeyRound, CheckCircle2, Loader2 } from "lucide-react";

interface ClerkSignInClient {
  create: (params: { strategy: string; identifier: string }) => Promise<unknown>;
  attemptFirstFactor: (params: { strategy: string; code: string; password?: string }) => Promise<{
    status: string;
    createdSessionId?: string | null;
  }>;
}

interface SignInHelperProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function SignInHelper({ containerRef }: SignInHelperProps) {
  const router = useRouter();
  const clerk = useClerk();

  // Google detection states
  const [googleDetected, setGoogleDetected] = React.useState<boolean>(false);
  const [detectedEmail, setDetectedEmail] = React.useState<string>("");
  const [googleDismissed, setGoogleDismissed] = React.useState<boolean>(false);

  // Password reset modal states
  const [showResetModal, setShowResetModal] = React.useState<boolean>(false);
  const [resetStep, setResetStep] = React.useState<"email" | "code" | "success">("email");
  const [resetEmail, setResetEmail] = React.useState<string>("");
  const [resetCode, setResetCode] = React.useState<string>("");
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [resetLoading, setResetLoading] = React.useState<boolean>(false);
  const [resetError, setResetError] = React.useState<string>("");

  // Portal mount targets
  const [forgotPasswordSlot, setForgotPasswordSlot] = React.useState<HTMLElement | null>(null);
  const [alertSlot, setAlertSlot] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let observer: MutationObserver | null = null;

    const checkAndMount = () => {
      if (!root) return;

      // 1. Mount "Forgot password?" button next to Password label
      const pwdInput = root.querySelector<HTMLInputElement>('input[type="password"]');
      if (pwdInput) {
        const pwdField = (pwdInput.closest(".cl-formField") || pwdInput.parentElement) as HTMLElement | null;
        if (pwdField) {
          let labelRow = pwdField.querySelector<HTMLElement>(".cl-formFieldLabelRow");
          if (!labelRow) {
            const label = pwdField.querySelector<HTMLElement>(".cl-formFieldLabel");
            if (label && label.parentElement && !label.parentElement.classList.contains("spacia-label-row")) {
              const row = document.createElement("div");
              row.className = "spacia-label-row flex items-center justify-between w-full mb-1";
              label.parentElement.insertBefore(row, label);
              row.appendChild(label);
              labelRow = row;
            }
          }

          if (labelRow) {
            let customSlot = labelRow.querySelector<HTMLElement>(".spacia-forgot-password-slot");
            if (!customSlot) {
              customSlot = document.createElement("div");
              customSlot.className = "spacia-forgot-password-slot";
              labelRow.appendChild(customSlot);
              setForgotPasswordSlot(customSlot);
            } else {
              setForgotPasswordSlot(customSlot);
            }
          }
        }
      }

      // 2. Alert slot above the form
      const form = root.querySelector<HTMLElement>(".cl-form");
      if (form) {
        let alertMount = form.querySelector<HTMLElement>(".spacia-google-auth-alert-slot");
        if (!alertMount) {
          alertMount = document.createElement("div");
          alertMount.className = "spacia-google-auth-alert-slot w-full";
          form.insertBefore(alertMount, form.firstChild);
          setAlertSlot(alertMount);
        } else {
          setAlertSlot(alertMount);
        }
      }

      // 3. Track last used email if provider was Google
      try {
        const lastProvider = localStorage.getItem("spacia_last_auth_provider");
        const lastEmail = localStorage.getItem("spacia_last_auth_email");
        if (lastProvider === "google") {
          if (lastEmail && !detectedEmail) {
            setDetectedEmail(lastEmail);
          }
        }
      } catch {
        // ignore
      }

      // 4. Detect auth errors from Clerk
      const errorEl = root.querySelector<HTMLElement>(
        ".cl-formFieldErrorText, .cl-alert, .cl-formFieldError, [data-localization-key*='error']"
      );
      if (errorEl && errorEl.textContent && errorEl.textContent.trim().length > 0) {
        setGoogleDetected(true);
      }
    };

    checkAndMount();
    observer = new MutationObserver(checkAndMount);
    observer.observe(root, { childList: true, subtree: true });

    // Track input events on email field
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && (target.type === "email" || target.name === "identifier")) {
        const val = target.value.trim().toLowerCase();
        try {
          const savedEmail = localStorage.getItem("spacia_last_auth_email");
          const savedProvider = localStorage.getItem("spacia_last_auth_provider");

          if (savedProvider === "google" && savedEmail && val && val === savedEmail.toLowerCase()) {
            setGoogleDetected(true);
            setGoogleDismissed(false);
          } else if (val.endsWith("@gmail.com") || val.endsWith("@googlemail.com")) {
            setGoogleDetected(true);
          }
        } catch {
          // ignore
        }
      }
    };

    root.addEventListener("input", handleInput);

    return () => {
      observer?.disconnect();
      root.removeEventListener("input", handleInput);
    };
  }, [containerRef, detectedEmail]);

  // Open the password reset dialog
  const handleOpenReset = () => {
    const root = containerRef.current;
    let initialEmail = "";
    if (root) {
      const emailInput = root.querySelector<HTMLInputElement>(
        'input[type="email"], input[name="identifier"], input#identifier'
      );
      if (emailInput && emailInput.value.trim()) {
        initialEmail = emailInput.value.trim();
      }
    }
    setResetEmail(initialEmail || detectedEmail);
    setResetStep("email");
    setResetError("");
    setShowResetModal(true);
  };

  // Trigger Google sign-in
  const handleGoogleClick = () => {
    const root = containerRef.current;
    if (!root) return;

    const googleBtn = root.querySelector<HTMLButtonElement>(
      'button[data-provider="google"], .cl-socialButtonsBlockButton__google, .cl-socialButtonsBlockButton'
    );
    if (googleBtn) {
      googleBtn.click();
    }
  };

  // Step 1: Send reset code to email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError("Please enter your email address.");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      const client = clerk.client;
      const signInClient = client ? ((client as unknown as { signIn: ClerkSignInClient }).signIn) : null;
      if (signInClient) {
        await signInClient.create({
          strategy: "reset_password_email_code",
          identifier: resetEmail.trim(),
        });
        setResetStep("code");
      } else {
        setResetError("Authentication client not ready. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      setResetError(
        clerkErr?.errors?.[0]?.longMessage ||
          clerkErr?.errors?.[0]?.message ||
          "Could not send reset code. Please verify your email."
      );
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Attempt reset with code and new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      setResetError("Please enter both the reset code and your new password.");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      const client = clerk.client;
      const signInClient = client ? ((client as unknown as { signIn: ClerkSignInClient }).signIn) : null;
      if (signInClient) {
        const result = await signInClient.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code: resetCode.trim(),
          password: newPassword,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await clerk.setActive({ session: result.createdSessionId });
          setResetStep("success");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1200);
        } else {
          setResetStep("success");
        }
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      setResetError(
        clerkErr?.errors?.[0]?.longMessage ||
          clerkErr?.errors?.[0]?.message ||
          "Invalid code or password. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      {/* 1. "Forgot password?" Link in Password Label Row */}
      {forgotPasswordSlot &&
        createPortal(
          <button
            type="button"
            onClick={handleOpenReset}
            className="text-[11px] font-medium text-[#0d4a36] hover:text-[#093829] hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Forgot password?
          </button>,
          forgotPasswordSlot
        )}

      {/* 2. "You signed up with Google" Notification Alert */}
      {alertSlot &&
        googleDetected &&
        !googleDismissed &&
        createPortal(
          <div className="mb-2.5 p-3 rounded-md bg-amber-50/95 border border-amber-200/90 text-amber-900 text-xs shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-950">
                    Did you sign up with Google?
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    If you created your account with Google, please use the{" "}
                    <strong>Continue with Google</strong> button below to sign in without a password.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    className="mt-1 inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                  >
                    <span>Continue with Google</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleDismissed(true)}
                className="text-amber-500 hover:text-amber-700 p-0.5 rounded cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>,
          alertSlot
        )}

      {/* 3. Interactive Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d4a36] text-white">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-stone-900">
                    Reset Password
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {resetStep === "email" && "We'll send a verification code to your email."}
                    {resetStep === "code" && "Enter the code and choose a new password."}
                    {resetStep === "success" && "Password successfully reset!"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetError && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Step 1: Request code */}
            {resetStep === "email" && (
              <form onSubmit={handleSendCode} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Email address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-9 px-3 text-xs rounded-md border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-9 bg-[#0d4a36] hover:bg-[#093829] text-white text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {resetLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Send Reset Code</span>
                </button>
              </form>
            )}

            {/* Step 2: Code and New Password */}
            {resetStep === "code" && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Verification Code</label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full h-9 px-3 text-xs rounded-md border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full h-9 px-3 text-xs rounded-md border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-9 bg-[#0d4a36] hover:bg-[#093829] text-white text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {resetLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Set New Password & Sign In</span>
                </button>
              </form>
            )}

            {/* Step 3: Success */}
            {resetStep === "success" && (
              <div className="py-4 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-semibold text-stone-900">
                  Password updated! Redirecting to dashboard...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
