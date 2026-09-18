import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { HumanActorDetails } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, ShieldCheck, MapPin } from "lucide-react";

export interface HumanActivityIndicatorProps {
  actor: HumanActorDetails;
  variant?: "badge" | "compact" | "detailed";
  className?: string;
}

export function HumanActivityIndicator({
  actor,
  variant = "compact",
  className,
}: HumanActivityIndicatorProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium bg-indigo-50/70 border-indigo-200/80 text-indigo-900 select-none",
          className
        )}
      >
        <UserCheck className="h-3 w-3 text-indigo-700" />
        <span>{actor.name}</span>
        {actor.verifiedBadge && (
          <ShieldCheck className="h-3 w-3 text-emerald-700" />
        )}
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "p-3 rounded-lg border border-indigo-200/70 bg-gradient-to-r from-indigo-50/40 via-white to-stone-50/30 space-y-2",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 border border-indigo-200">
              {actor.avatarUrl && <AvatarImage src={actor.avatarUrl} alt={actor.name} />}
              <AvatarFallback className="bg-indigo-100 text-indigo-800 text-xs font-semibold">
                {getInitials(actor.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-stone-900 leading-tight">
                  {actor.name}
                </span>
                <span className="rounded bg-indigo-100 px-1 py-0.2 text-[9px] font-bold text-indigo-900 uppercase tracking-wider">
                  Broker Takeover
                </span>
              </div>
              <p className="text-[11px] text-stone-500">{actor.role}</p>
            </div>
          </div>

          {actor.verifiedBadge && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="h-3 w-3 text-emerald-700" />
              Verified Broker
            </span>
          )}
        </div>

        {/* Territory & Reason */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100/80 text-[10px] text-stone-600">
          {actor.territory && (
            <div className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded border border-stone-200 text-stone-600">
              <MapPin className="h-3 w-3 text-stone-400" />
              <span>{actor.territory}</span>
            </div>
          )}

          {actor.takeoverReason && (
            <span className="italic text-stone-500 truncate max-w-[280px]">
              &ldquo;{actor.takeoverReason}&rdquo;
            </span>
          )}
        </div>
      </div>
    );
  }

  // Compact layout (Default)
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2 py-1 rounded-md border border-indigo-200/80 bg-indigo-50/50 text-xs text-stone-800",
        className
      )}
    >
      <Avatar className="h-5 w-5 shrink-0 border border-indigo-200">
        {actor.avatarUrl && <AvatarImage src={actor.avatarUrl} alt={actor.name} />}
        <AvatarFallback className="bg-indigo-100 text-indigo-800 text-[9px] font-bold">
          {getInitials(actor.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 truncate">
        <span className="font-medium text-stone-900 text-[11px] truncate">
          {actor.name}
        </span>
        <span className="text-[10px] text-indigo-700 font-medium truncate">
          (Human Broker)
        </span>
      </div>
    </div>
  );
}
