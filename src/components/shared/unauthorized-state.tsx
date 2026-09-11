"use client";

import * as React from "react";
import { Building2, ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";

export interface UnauthorizedStateProps {
  title?: string;
  description?: string;
}

export function UnauthorizedState({
  title = "No Real-Estate Workspace Assigned",
  description = "Your account is authenticated with Clerk, but you are not currently assigned to an active real-estate workspace.",
}: UnauthorizedStateProps) {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa] p-4 font-sans text-stone-900">
      <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-stone-900">
              {title}
            </h1>
            <p className="text-xs text-stone-500">
              Pacia Operational Real-Estate Platform
            </p>
          </div>
        </div>

        {/* User Context Card */}
        {user && (
          <div className="mt-5 rounded-lg border border-stone-200/80 bg-stone-50/70 p-3 flex items-center justify-between text-xs">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-semibold text-stone-800 truncate">{user.name}</span>
              <span className="text-stone-500 text-[11px] truncate">{user.email}</span>
            </div>
            <span className="rounded bg-stone-200/60 px-2 py-0.5 text-[10px] font-medium text-stone-600 shrink-0">
              Authenticated
            </span>
          </div>
        )}

        {/* Explanatory Context */}
        <div className="mt-5 rounded-lg border border-amber-200/60 bg-amber-50/50 p-4 text-xs text-amber-900 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-amber-950 mb-1">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Organization Access Required</span>
          </div>
          <p>{description}</p>
          <p className="mt-2 text-stone-600">
            To access the sales dashboard, lead pipeline, and AI qualification core, your administrator must invite your account to their organization.
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-stone-100">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto h-8.5 gap-2 text-xs text-stone-700 hover:bg-stone-100 border-stone-200"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5 text-stone-500" />
            Check Access
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isSigningOut}
            className="w-full sm:w-auto sm:ml-auto h-8.5 gap-2 text-xs text-stone-700 hover:bg-stone-100 border-stone-200"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5 text-stone-500" />
            {isSigningOut ? "Signing out..." : "Switch Account"}
          </Button>
        </div>
      </div>
    </div>
  );
}
