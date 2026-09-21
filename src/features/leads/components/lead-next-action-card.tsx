"use client";

import * as React from "react";
import type { NextActionDirective } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ArrowRight, UserCheck, Bot } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LeadNextActionCardProps {
  directive?: NextActionDirective;
  fallbackAction?: string;
  onExecuteAction?: () => void;
}

export function LeadNextActionCard({
  directive,
  fallbackAction,
  onExecuteAction,
}: LeadNextActionCardProps) {
  const [isCompleted, setIsCompleted] = React.useState(false);

  const actionText = directive?.action || fallbackAction || "Autonomous qualification monitoring";
  const assignedTo = directive?.assignedTo || "Autonomous AI Engine";
  const priority = directive?.priority || "Routine";
  const dueDate = directive?.dueDate || "Active";
  const recommendation = directive?.protocolRecommendation;

  const isAI = assignedTo.toLowerCase().includes("ai") || assignedTo.toLowerCase().includes("autonomous");

  const priorityBadgeStyles = {
    Immediate: "bg-rose-50 text-rose-700 border-rose-200",
    Scheduled: "bg-amber-50 text-amber-800 border-amber-200",
    Routine: "bg-stone-100 text-stone-700 border-stone-200",
  }[priority];

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
        isCompleted
          ? "border-emerald-200/80 bg-emerald-50/40"
          : "border-stone-200/70 bg-white"
      )}
    >
      {/* Top row: Priority & Assignee tags */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5 text-xs">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold uppercase tracking-wider", priorityBadgeStyles)}
          >
            {priority} Priority
          </Badge>
          <span className="text-stone-300">•</span>
          <div className="flex items-center gap-1 text-[11px] text-stone-600 font-medium">
            {isAI ? (
              <Bot className="h-3 w-3 text-[#0d4a36]" />
            ) : (
              <UserCheck className="h-3 w-3 text-emerald-700" />
            )}
            <span>{assignedTo}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-stone-500">
          <Clock className="h-3 w-3 text-stone-400" />
          <span>Due: {dueDate}</span>
        </div>
      </div>

      {/* Main directive content */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Next Operational Directive
        </span>
        <h4 className="text-sm font-semibold text-stone-900 leading-snug">
          {actionText}
        </h4>
        {recommendation && (
          <p className="text-xs text-stone-600 leading-relaxed pt-0.5">
            {recommendation}
          </p>
        )}
      </div>

      {/* Operational action trigger */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-100/80 text-xs">
        <span className="text-[11px] text-stone-400">
          {isCompleted ? "Protocol executed" : "Sales desk protocol"}
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isCompleted ? "outline" : "default"}
            onClick={() => {
              setIsCompleted(!isCompleted);
              if (!isCompleted && onExecuteAction) {
                onExecuteAction();
              }
            }}
            className={cn(
              "h-7 text-xs gap-1.5 px-2.5 cursor-pointer font-medium",
              isCompleted
                ? "border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                : "bg-[#0d4a36] hover:bg-[#093829] text-white"
            )}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Marked Done</span>
              </>
            ) : (
              <>
                <span>Execute Action</span>
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
