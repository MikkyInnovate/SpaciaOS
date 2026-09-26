import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  PhoneCall,
  Calendar,
  UserCheck,
  Globe,
  Database,
  Radio,
  MessageSquare,
  FileCheck,
  FileText,
  Clock,
  Sparkles,
  Mail,
  Send,
  Filter,
} from "lucide-react";
import { RevenuePathResponse, RevenuePathNode, RevenuePathCategory } from "../types";

interface RevenuePathStepperProps {
  data: RevenuePathResponse;
  isLoading?: boolean;
}

const CATEGORY_MAP: Record<
  RevenuePathCategory,
  {
    label: string;
    badge: string;
    border: string;
    icon: React.ElementType;
  }
> = {
  ingestion: {
    label: "Ingestion & Core",
    badge: "bg-stone-100 text-stone-700 border-stone-200",
    border: "border-stone-200",
    icon: Globe,
  },
  qualification: {
    label: "AI Underwriting",
    badge: "bg-emerald-50 text-[#0d4a36] border-emerald-200",
    border: "border-emerald-200/60",
    icon: FileCheck,
  },
  voice: {
    label: "Voice Intelligence",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    border: "border-teal-200/60",
    icon: PhoneCall,
  },
  scheduling: {
    label: "Calendar Engine",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
    border: "border-sky-200/60",
    icon: Calendar,
  },
  closing: {
    label: "Closing & Handoff",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    border: "border-amber-200/60",
    icon: UserCheck,
  },
};

const STEP_ICONS: Record<string, React.ElementType> = {
  website_lead: Globe,
  spacia_core: Database,
  ai_contact: Radio,
  conversation: MessageSquare,
  verified_property_data: ShieldCheck,
  qualification: FileCheck,
  score: Sparkles,
  call: PhoneCall,
  transcript: FileText,
  summary: FileCheck,
  follow_up: Clock,
  viewing_request: Calendar,
  calendar_availability: CheckCircle2,
  viewing_booking: Calendar,
  email_confirmation: Mail,
  sales_notification: Send,
  human_handoff: UserCheck,
};

export function RevenuePathStepper({
  data,
  isLoading = false,
}: RevenuePathStepperProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<RevenuePathCategory | "all">("all");
  const [activeStep, setActiveStep] = React.useState<number | null>(null);

  if (isLoading) {
    return (
      <Card className="bg-white border-border shadow-2xs">
        <CardHeader>
          <div className="h-6 w-52 bg-stone-100 rounded animate-pulse" />
          <div className="h-4 w-80 bg-stone-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const { nodes, operationalNodes, totalNodes, readinessPercentage } = data;

  const filteredNodes =
    selectedCategory === "all"
      ? nodes
      : nodes.filter((n) => n.category === selectedCategory);

  return (
    <Card className="bg-white border-stone-200 shadow-2xs overflow-hidden">
      <CardHeader className="border-b border-stone-100 pb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-display font-bold text-stone-900">
              Sales Pipeline
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 mt-1">
              Full journey from website enquiry to broker handoff
            </CardDescription>
          </div>

          {/* Readiness Status */}
          <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200/80 px-4 py-2.5 rounded-xl shadow-2xs">
            <div className="relative flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75 absolute" />
              <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>{operationalNodes}/{totalNodes} Steps Active</span>
                <span className="font-mono text-[11px] font-semibold text-emerald-700">
                  ({readinessPercentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills by Category */}
        <div className="flex items-center gap-1.5 flex-wrap pt-3">
          <Button
            size="sm"
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "h-7 text-xs px-2.5 cursor-pointer rounded-lg",
              selectedCategory === "all"
                ? "bg-[#0d4a36] text-white hover:bg-[#0d4a36]/90"
                : "text-stone-600 border-stone-200 hover:bg-stone-50"
            )}
          >
            All Steps
          </Button>

          {(
            [
              "ingestion",
              "qualification",
              "voice",
              "scheduling",
              "closing",
            ] as RevenuePathCategory[]
          ).map((cat) => {
            const config = CATEGORY_MAP[cat];
            const isSelected = selectedCategory === cat;
            return (
              <Button
                key={cat}
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "h-7 text-xs px-2.5 cursor-pointer rounded-lg",
                  isSelected
                    ? "bg-[#0d4a36] text-white hover:bg-[#0d4a36]/90"
                    : "text-stone-600 border-stone-200 hover:bg-stone-50"
                )}
              >
                {config.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>

      {/* 17-Point Pipeline Grid */}
      <CardContent className="pt-6 pb-6">
        <div className="relative">
          {/* Subtle connecting vertical track in the background for stepper feel */}
          <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-stone-200/70 hidden sm:block pointer-events-none" />

          <div className="space-y-3">
            {filteredNodes.map((node) => {
              const Icon = STEP_ICONS[node.key] || Zap;
              const catConfig = CATEGORY_MAP[node.category];
              const isSelected = activeStep === node.step;

              return (
                <div
                  key={node.key}
                  onClick={() => setActiveStep(isSelected ? null : node.step)}
                  className={cn(
                    "relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs bg-white",
                    node.status === "operational"
                      ? "border-stone-200 hover:border-emerald-300"
                      : "border-stone-200/60 opacity-80",
                    isSelected
                      ? "ring-2 ring-[#0d4a36] border-[#0d4a36] bg-stone-50/50"
                      : ""
                  )}
                >
                  {/* Left: Step number icon + details */}
                  <div className="flex items-center gap-3 z-10">
                    <div className="relative">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs border transition-colors",
                          node.status === "operational"
                            ? "bg-emerald-50 text-[#0d4a36] border-emerald-300"
                            : "bg-stone-100 text-stone-500 border-stone-200"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#0d4a36] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                        {node.step}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-stone-900">
                          {node.label}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 rounded",
                            catConfig.badge
                          )}
                        >
                          {catConfig.label}
                        </Badge>

                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {node.description}
                      </div>
                    </div>
                  </div>

                  {/* Right: Operational Status & Events Count */}
                  <div className="flex items-center gap-4 mt-2 sm:mt-0 z-10 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-[10px] text-stone-400 font-medium">
                        Activity
                      </div>
                      <div className="text-xs font-bold font-mono text-stone-800">
                        {node.eventsRecorded.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span className="text-[11px] font-semibold text-emerald-800 capitalize">
                        {node.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
