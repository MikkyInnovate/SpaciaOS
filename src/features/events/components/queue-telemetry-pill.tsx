"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QueueJob {
  id: string;
  title: string;
  category: "underwriting" | "telephony" | "scheduler" | "duplicate_scan";
  status: "completed" | "in_progress" | "idle";
  latencyFormatted: string;
  channel: string;
  timeAgo: string;
}

const DEFAULT_QUEUE_JOBS: QueueJob[] = [
  {
    id: "job_01",
    title: "Autonomous Lead Intake & Scoring",
    category: "underwriting",
    status: "completed",
    latencyFormatted: "140ms",
    channel: "Spacia BANT Engine",
    timeAgo: "12s ago",
  },
  {
    id: "job_02",
    title: "Vapi Outbound Telephony Dispatcher",
    category: "telephony",
    status: "in_progress",
    latencyFormatted: "380ms",
    channel: "WebRTC / SIP Line",
    timeAgo: "Live",
  },
  {
    id: "job_03",
    title: "Follow-up Touchpoint Scheduler",
    category: "scheduler",
    status: "completed",
    latencyFormatted: "45ms",
    channel: "Broker Cadence Engine",
    timeAgo: "1m ago",
  },
  {
    id: "job_04",
    title: "Canonical Duplicate Detection Index",
    category: "duplicate_scan",
    status: "completed",
    latencyFormatted: "18ms",
    channel: "Workspace Registry",
    timeAgo: "Active",
  },
];

export function QueueTelemetryPill({ className }: { className?: string }) {
  const [jobs] = React.useState<QueueJob[]>(DEFAULT_QUEUE_JOBS);
  const activeCount = jobs.filter((j) => j.status === "in_progress").length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-stone-200/80 bg-white hover:bg-stone-50 text-stone-700 text-xs shadow-2xs transition-colors cursor-pointer"
          title="Inspect Background Automation Queue"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-medium text-[11px] text-stone-800">
            Queue: {activeCount > 0 ? `${activeCount} Active` : "Operational"}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">({jobs.length} jobs)</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 border border-stone-200/80 bg-white shadow-xl rounded-xl">
        {/* Header */}
        <div className="p-3.5 pb-2.5 border-b border-stone-100 bg-[#fcfcfb] rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0d4a36] text-white shadow-2xs">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-stone-900">
                Automation Queue Telemetry
              </span>
            </div>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-emerald-800 bg-emerald-50/60 border-emerald-200">
              Live Health
            </Badge>
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            Async worker pipeline for underwriting, telephony & duplicate indexing.
          </p>
        </div>

        {/* Job List */}
        <div className="p-2 space-y-1.5 divide-y divide-stone-100">
          {jobs.map((job) => (
            <div key={job.id} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 px-1 text-xs">
              <div className="space-y-0.5 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 font-medium text-stone-900 text-[11px]">
                  {job.status === "in_progress" ? (
                    <RefreshCw className="h-3 w-3 animate-spin text-emerald-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-stone-400 shrink-0" />
                  )}
                  <span className="truncate">{job.title}</span>
                </div>
                <div className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                  <span>{job.channel}</span>
                  <span>•</span>
                  <span>{job.latencyFormatted}</span>
                </div>
              </div>

              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 font-medium ${
                  job.status === "in_progress"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-stone-100 text-stone-600 border border-stone-200/60"
                }`}
              >
                {job.status === "in_progress" ? "RUNNING" : "DONE"}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-stone-100 bg-[#fcfcfb] rounded-b-xl flex items-center justify-between text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-stone-400" />
            <span>Zero failed tasks</span>
          </span>
          <span className="font-mono">Avg. Latency: 145ms</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
