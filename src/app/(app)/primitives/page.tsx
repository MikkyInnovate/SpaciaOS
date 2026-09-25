"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { StatusBadge, type DomainStatus } from "@/components/ui/status-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { cn } from "@/lib/utils/cn";
import { EmptyState, type EmptyStatePreset } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { FormField, FormLabel, FormDescription } from "@/components/ui/form-field";
import { SearchInput } from "@/components/ui/search-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  WorkflowStatusIndicator,
  AIActivityIndicator,
  HumanActivityIndicator,
  WorkflowRetryState,
  ActivityEventCard,
  AutomationEventFeed,
  type WorkflowExecutionStatus,
} from "@/features/events";
import { toast } from "sonner";
import {
  Sliders,
  Table as TableIcon,
  Tag,
  Gauge,
  Layers,
  FolderOpen,
  AlertTriangle,
  Phone,
  Building,
  Activity,
  Sparkles,
  UserCheck,
  Brain,
  ShieldAlert,
  BotOff,
  CalendarClock,
  Lightbulb,
  FileQuestion,
  CheckCircle2,
  Mail,
  Bell,
  BellRing,
  User,
} from "lucide-react";
import {
  BuyerIntentBadge,
  IntentConfidenceGauge,
  IntentSignalPill,
  BuyerIntentCard,
  BUYER_INTENT_META,
  type BuyerIntentCategory,
} from "@/features/ai-agent";
import {
  ConversationStateBadge,
  ConversationMessageItem,
} from "@/features/conversations";
import {
  QualificationPanel,
  MOCK_LEADS,
  HumanSupervisionCockpit,
  HandoffContextCard,
  RecommendedActionCard,
  FollowUpScheduleCard,
  leadsService,
  type Lead,
  type LossReasonCategory,
  type LossDetails,
  type FollowUpSchedule,
} from "@/features/leads";
import {
  CallRecordingBadge,
  CallOutcomeBadge,
  CallAudioPlayer,
  CallMetricsStrip,
  TranscriptViewer,
  CallSummaryCard,
  MOCK_CALLS,
} from "@/features/calls";
import {
  AvailabilitySelector,
  appointmentsService,
  type ViewingSlot,
} from "@/features/appointments";

interface SampleLead {
  id: string;
  name: string;
  phone: string;
  property: string;
  budget: string;
  score: number;
  status: DomainStatus;
}

const SAMPLE_LEADS: SampleLead[] = [
  {
    id: "lead_1",
    name: "Chief Raymond Cole",
    phone: "+234 803 123 4567",
    property: "5-Bed Smart Villa — Eko Atlantic",
    budget: "₦450,000,000",
    score: 95,
    status: "Qualified",
  },
  {
    id: "lead_2",
    name: "Dr. Chioma Nnamdi",
    phone: "+234 802 987 6543",
    property: "Waterfront Penthouse — Ikoyi",
    budget: "₦280,000,000",
    score: 88,
    status: "Viewing Booked",
  },
  {
    id: "lead_3",
    name: "Babatunde Adeleke",
    phone: "+234 809 555 1212",
    property: "4-Bed Terrace — Lekki Phase 1",
    budget: "₦140,000,000",
    score: 72,
    status: "In Conversation",
  },
  {
    id: "lead_4",
    name: "Folake Wright",
    phone: "+234 814 333 4455",
    property: "Luxury Maisonette — Victoria Island",
    budget: "₦320,000,000",
    score: 64,
    status: "Contacting",
  },
  {
    id: "lead_5",
    name: "Ibrahim Musa",
    phone: "+234 805 777 8899",
    property: "3-Bed Apartment — Ikeja GRA",
    budget: "₦75,000,000",
    score: 42,
    status: "Cold",
  },
];

export default function PrimitivesShowcasePage() {
  // 1. Table test controls
  const [tableLoading, setTableLoading] = React.useState(false);
  const [tableError, setTableError] = React.useState(false);
  const [tableEmpty, setTableEmpty] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<SampleLead | null>(null);

  // 2. Score slider
  const [interactiveScore, setInteractiveScore] = React.useState(85);

  // 3. Empty state preset
  const [emptyPreset, setEmptyPreset] = React.useState<EmptyStatePreset>("no-leads");

  // 4. Dialog & Drawer states
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // 5. Form states
  const [formSearch, setFormSearch] = React.useState("");
  const [formCurrency, setFormCurrency] = React.useState("150000000");
  const [formRawBudget, setFormRawBudget] = React.useState(150000000);
  const [formCheckbox, setFormCheckbox] = React.useState(true);
  const [formSwitch, setFormSwitch] = React.useState(true);

  // 6. Day 11 Qualification Testbench state
  const [selectedQualificationLeadId, setSelectedQualificationLeadId] = React.useState("lead_01");
  const activeQualificationLead = React.useMemo(() => {
    return MOCK_LEADS.find((l) => l.id === selectedQualificationLeadId) || MOCK_LEADS[0];
  }, [selectedQualificationLeadId]);
  const [formNotes, setFormNotes] = React.useState(
    "High net-worth buyer looking for waterfront property with private boat jetty."
  );

  // 6. Day 8 Event & Automation Showcase State
  const [interactiveWorkflowStatus, setInteractiveWorkflowStatus] =
    React.useState<WorkflowExecutionStatus>("retrying");
  const [interactiveRetryAttempt, setInteractiveRetryAttempt] = React.useState(2);
  const interactiveMaxRetries = 3;
  const [interactiveIndicatorVariant, setInteractiveIndicatorVariant] =
    React.useState<"badge" | "pill" | "dot-only" | "expanded">("badge");
  const [interactiveAILive, setInteractiveAILive] = React.useState(true);

  // 7. Day 9 AI Confidence & Intent Showcase State
  const [interactiveConfidence, setInteractiveConfidence] = React.useState(92);

  // 8. Day 13 Human-in-the-Loop Supervision Showcase State
  const [day13Leads, setDay13Leads] = React.useState<Lead[]>(() => [...MOCK_LEADS]);
  const [selectedDay13LeadId, setSelectedDay13LeadId] = React.useState("lead_01");
  const activeDay13Lead = React.useMemo(() => {
    return day13Leads.find((l) => l.id === selectedDay13LeadId) || day13Leads[0];
  }, [day13Leads, selectedDay13LeadId]);

  const handleDay13Takeover = async (leadId: string, brokerName?: string, reason?: string) => {
    try {
      const updated = await leadsService.takeoverLead(leadId, brokerName || "Marcus Vance (Broker)", reason);
      setDay13Leads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      toast.success("Broker Takeover Active", {
        description: `Autonomous AI paused for ${updated.name}. Broker assigned.`,
      });
    } catch {
      toast.error("Takeover failed");
    }
  };

  const handleDay13StopAI = async (leadId: string, reason?: string) => {
    try {
      const updated = await leadsService.stopAI(leadId, reason || "Broker intervention requested from primitives testbench.");
      setDay13Leads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      toast.warning("AI Processing Suspended", {
        description: `Voice & messaging paused for ${updated.name}.`,
      });
    } catch {
      toast.error("Failed to stop AI");
    }
  };

  const handleDay13ResumeAI = async (leadId: string) => {
    try {
      const updated = await leadsService.resumeAI(leadId);
      setDay13Leads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      toast.success("AI Automation Resumed", {
        description: `Pacia conversational agent reactivated for ${updated.name}.`,
      });
    } catch {
      toast.error("Failed to resume AI");
    }
  };

  const handleDay13MarkNurture = async (
    leadId: string,
    schedule: FollowUpSchedule,
    notes?: string
  ) => {
    try {
      const updated = await leadsService.markNurture(leadId, schedule, notes);
      setDay13Leads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      toast.info("Lead Reassigned to Nurture", {
        description: `${updated.name} staged for follow-up (${schedule.cadence}).`,
      });
    } catch {
      toast.error("Failed to set nurture");
    }
  };

  const handleDay13MarkLost = async (
    leadId: string,
    lossDetails: LossDetails
  ) => {
    try {
      const updated = await leadsService.markLost(leadId, lossDetails);
      setDay13Leads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      toast.error("Lead Marked as Lost", {
        description: `${updated.name} archived (${lossDetails.reasonLabel}).`,
      });
    } catch {
      toast.error("Failed to mark lost");
    }
  };

  const handleDay13UpdateSchedule = async (leadId: string, schedule: FollowUpSchedule) => {
    try {
      const updated = await leadsService.updateFollowUpSchedule(leadId, schedule);
      setDay13Leads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      toast.success("Follow-up Rescheduled", {
        description: `Next action slated for ${new Date(schedule.scheduledAt).toLocaleDateString("en-NG")}.`,
      });
    } catch {
      toast.error("Failed to reschedule follow-up");
    }
  };

  // 13. Availability Selector State (Day 16)
  const [testAvailabilitySlot, setTestAvailabilitySlot] = React.useState<any>(null);
  const [testAvailabilityDate, setTestAvailabilityDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });

  // 14. Notifications & Reminders State (Day 19 Deliverable)
  const [reminderDispatched, setReminderDispatched] = React.useState<string | null>(null);
  const [isSendingPrimitiveReminder, setIsSendingPrimitiveReminder] = React.useState(false);

  // DataTable columns definition
  const columns: ColumnDef<SampleLead>[] = [
    {
      id: "prospect",
      header: "Prospect",
      sortable: true,
      accessorKey: "name",
      cell: ({ item }) => (
        <div>
          <div className="font-semibold text-stone-900">{item.name}</div>
          <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
            <Phone className="h-3 w-3 text-stone-400" />
            <span>{item.phone}</span>
          </div>
        </div>
      ),
    },
    {
      id: "property",
      header: "Property of Interest",
      sortable: true,
      accessorKey: "property",
      cell: ({ item }) => (
        <div className="flex items-center gap-1.5 text-stone-800">
          <Building className="h-3.5 w-3.5 text-stone-400 shrink-0" />
          <span className="truncate max-w-[220px]">{item.property}</span>
        </div>
      ),
    },
    {
      id: "budget",
      header: "Budget",
      sortable: true,
      accessorKey: "budget",
      align: "right",
      cell: ({ item }) => (
        <span className="font-mono font-semibold text-stone-900 tabular-nums">
          {item.budget}
        </span>
      ),
    },
    {
      id: "score",
      header: "Score",
      sortable: true,
      accessorKey: "score",
      align: "center",
      cell: ({ item }) => (
        <ScoreIndicator score={item.score} variant="badge" size="sm" />
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      accessorKey: "status",
      cell: ({ item }) => <StatusBadge status={item.status} withDot />,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: ({ item }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2 text-stone-700 bg-white hover:bg-stone-50"
          onClick={() => {
            setSelectedLead(item);
            setIsDrawerOpen(true);
          }}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <Container size="lg" className="space-y-8 pb-16">
      <PageHeader
        title="Command-Center UI Primitives"
        description="Day 4 Core Domain Database primitives testbench and design system showcase."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status="Operational" withDot pulse size="md" />
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 1. DATA TABLE TESTBENCH */}
      {/* ========================================================================= */}
      <Card className="border-border bg-white shadow-2xs">
        <CardHeader className="p-4 border-b border-stone-100 bg-stone-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d4a36] text-white">
                <TableIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-stone-900">
                  Generic DataTable Primitive
                </CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Fully typed generic table with sorting, search query filtering, pagination, and state toggles.
                </CardDescription>
              </div>
            </div>

            {/* Testbench State Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={tableLoading ? "default" : "outline"}
                size="sm"
                className="h-7.5 text-xs"
                onClick={() => setTableLoading((p) => !p)}
              >
                {tableLoading ? "Stop Loading" : "Simulate Loading"}
              </Button>
              <Button
                variant={tableError ? "destructive" : "outline"}
                size="sm"
                className="h-7.5 text-xs"
                onClick={() => setTableError((p) => !p)}
              >
                {tableError ? "Clear Error" : "Simulate Error"}
              </Button>
              <Button
                variant={tableEmpty ? "secondary" : "outline"}
                size="sm"
                className="h-7.5 text-xs"
                onClick={() => setTableEmpty((p) => !p)}
              >
                {tableEmpty ? "Restore Data" : "Simulate Empty"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <DataTable
            data={tableEmpty ? [] : SAMPLE_LEADS}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={tableLoading}
            error={tableError ? new Error("Failed to fetch leads: 500 Internal Server Error") : null}
            onRetry={() => {
              setTableError(false);
              toast.success("Retried request successfully!");
            }}
            pageSize={3}
            searchPlaceholder="Search leads by prospect or property..."
            onRowClick={(lead) => {
              setSelectedLead(lead);
              setIsDrawerOpen(true);
            }}
          />
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 2. STATUS BADGES & SCORE INDICATORS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Badges */}
        <Card className="border-border bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#0d4a36]" />
              <CardTitle className="text-sm font-semibold text-stone-900">
                StatusBadge Primitive
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-stone-500">
              Covers all real-estate qualification tiers, lifecycle stages, and call outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-700">Lead Scoring Tiers</span>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="HOT" withDot />
                <StatusBadge status="WARM" withDot />
                <StatusBadge status="COLD" withDot />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-700">Operational & Call Outcomes</span>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="Qualified" withDot />
                <StatusBadge status="Viewing Booked" withDot />
                <StatusBadge status="In Conversation" withDot />
                <StatusBadge status="Contacting" withDot />
                <StatusBadge status="Follow-up" withDot />
                <StatusBadge status="Human Managed" withDot />
                <StatusBadge status="Nurture" withDot />
                <StatusBadge status="Lost" withDot />
                <StatusBadge status="New" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-700">Live Agent Indicators (Pulsing)</span>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="Operational" withDot pulse />
                <StatusBadge status="Live" withDot pulse />
                <StatusBadge status="Escalated" withDot pulse />
                <StatusBadge status="Offline" withDot />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Indicators */}
        <Card className="border-border bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[#0d4a36]" />
                <CardTitle className="text-sm font-semibold text-stone-900">
                  ScoreIndicator Primitive
                </CardTitle>
              </div>
              <span className="text-xs font-mono font-semibold text-stone-700">
                Score: {interactiveScore}
              </span>
            </div>
            <CardDescription className="text-xs text-stone-500">
              Drag the slider to test color transitions across Hot (80+), Warm (60-79), and Cold (&lt;60).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-5">
            {/* Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>0 (Unqualified)</span>
                <span>50</span>
                <span>100 (Elite Hot)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={interactiveScore}
                onChange={(e) => setInteractiveScore(Number(e.target.value))}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0d4a36]"
              />
            </div>

            {/* Badge Variant */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-stone-500">Variant: Badge</span>
              <div className="flex items-center gap-3">
                <ScoreIndicator score={interactiveScore} variant="badge" size="sm" />
                <ScoreIndicator score={interactiveScore} variant="badge" size="md" />
                <ScoreIndicator score={interactiveScore} variant="badge" size="lg" />
              </div>
            </div>

            {/* Gauge Variant */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-stone-500">Variant: Gauge</span>
              <ScoreIndicator score={interactiveScore} variant="gauge" />
            </div>

            {/* Breakdown Variant */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-stone-500">Variant: BANT Breakdown Matrix</span>
              <ScoreIndicator score={interactiveScore} variant="breakdown" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. RESILIENT EDGE STATES (EMPTY & ERROR) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Empty State Showcase */}
        <Card className="border-border bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[#0d4a36]" />
                <CardTitle className="text-sm font-semibold text-stone-900">
                  EmptyState Presets
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                {(["no-leads", "no-calls", "no-appointments", "no-search-results"] as EmptyStatePreset[]).map(
                  (preset) => (
                    <Button
                      key={preset}
                      variant={emptyPreset === preset ? "default" : "outline"}
                      size="sm"
                      className="h-6.5 text-[10px] px-2"
                      onClick={() => setEmptyPreset(preset)}
                    >
                      {preset.replace("no-", "")}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <EmptyState
              preset={emptyPreset}
              size="compact"
              onActionClick={() => toast.success(`Action clicked for ${emptyPreset}!`)}
            />
          </CardContent>
        </Card>

        {/* Error State Showcase */}
        <Card className="border-border bg-white shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <CardTitle className="text-sm font-semibold text-stone-900">
                ErrorState with Technical Details
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ErrorState
              title="Failed to synchronize broker calendar"
              description="The Google OAuth token for Marcus Vance expired or was revoked."
              errorCode="OAUTH_TOKEN_EXPIRED_401"
              errorDetails="Error: Refresh token returned invalid_grant at GoogleTokenClient.exchangeRefreshToken (node_modules/google-auth-library:142:18). Request ID: req_9a1288cba"
              onRetry={() => toast.info("Retrying calendar handshake...")}
              size="compact"
            />
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS & DRAWERS */}
      {/* ========================================================================= */}
      <Card className="border-border bg-white shadow-2xs">
        <CardHeader className="p-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#0d4a36]" />
            <CardTitle className="text-sm font-semibold text-stone-900">
              Modal &amp; Drawer Patterns
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-stone-500">
            Pre-built, accessible dialogs and inspection drawers with standardized headers, footers, and actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs cursor-pointer"
              onClick={() => setIsConfirmOpen(true)}
            >
              Open ConfirmDialog (Destructive / Takeover)
            </Button>

            <Button
              size="sm"
              className="h-8 text-xs bg-[#0d4a36] text-white hover:bg-[#0a3829] cursor-pointer"
              onClick={() => {
                setSelectedLead(SAMPLE_LEADS[0]);
                setIsDrawerOpen(true);
              }}
            >
              Open DetailDrawer (Lead Inspection)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 5. BASIC FORM COMPONENTS SUITE */}
      {/* ========================================================================= */}
      <Card className="border-border bg-white shadow-2xs">
        <CardHeader className="p-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#0d4a36]" />
            <CardTitle className="text-sm font-semibold text-stone-900">
              Basic Form Components Suite
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-stone-500">
            Real-estate calibrated inputs: Currency formatting (₦), search with instant clear, switch, checkbox, and FormField.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Currency Input */}
            <FormField error={formRawBudget < 10000000 ? "Minimum portfolio budget is ₦10,000,000" : undefined}>
              <FormLabel required>Verified Buyer Budget (CurrencyInput)</FormLabel>
              <CurrencyInput
                currencySymbol="₦"
                value={formCurrency}
                onValueChange={(formatted, raw) => {
                  setFormCurrency(formatted);
                  setFormRawBudget(raw);
                }}
              />
              <FormDescription>
                Raw numeric value: <span className="font-mono font-semibold">{formRawBudget}</span>
              </FormDescription>
            </FormField>

            {/* Search Input */}
            <FormField>
              <FormLabel>Quick Search Input (SearchInput)</FormLabel>
              <SearchInput
                placeholder="Search by prospect name, phone, or location..."
                value={formSearch}
                onChange={(e) => setFormSearch(e.target.value)}
                onClear={() => setFormSearch("")}
              />
              <FormDescription>Includes built-in magnifying glass and instant clear button.</FormDescription>
            </FormField>

            {/* Checkbox */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-stone-200 bg-stone-50/50">
              <Checkbox
                id="urgent-lead"
                checked={formCheckbox}
                onCheckedChange={setFormCheckbox}
              />
              <div className="space-y-0.5">
                <label htmlFor="urgent-lead" className="font-medium text-stone-800 cursor-pointer select-none">
                  Priority Autonomous Takeover
                </label>
                <p className="text-[11px] text-stone-500">
                  Notify on-call broker via WhatsApp if prospect score exceeds 85.
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-stone-50/50">
              <div className="space-y-0.5">
                <span className="font-medium text-stone-800">Autonomous Voice Scheduling</span>
                <p className="text-[11px] text-stone-500">
                  Allow AI agent to confirm physical walkthroughs automatically.
                </p>
              </div>
              <Switch checked={formSwitch} onCheckedChange={setFormSwitch} />
            </div>

            {/* Textarea */}
            <div className="md:col-span-2">
              <FormField>
                <FormLabel>Underwriting Notes (Textarea)</FormLabel>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Enter underwriting observations..."
                  className="min-h-[70px]"
                />
              </FormField>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 7. DAY 8 — EVENT SYSTEM & AUTOMATION FOUNDATION */}
      {/* ========================================================================= */}
      <Card className="border-stone-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-[#0d4a36] border border-emerald-200/60">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-stone-900">
                7. Day 8 — Event System &amp; Automation Foundation
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Asynchronous workflow lifecycle states, AI/Human actor indicators, failure diagnostics, and resilient retry mechanics.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 7.1 Workflow Status Indicator Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">
                7.1 Asynchronous Workflow Status Indicators
              </span>
              <span className="text-[11px] text-stone-500">
                Supports badge, pill, dot-only, and expanded callout variants
              </span>
            </div>

            {/* Interactive Control Toggles */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-stone-200 bg-stone-50/60 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-stone-600">Status State:</span>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      "in_progress",
                      "retrying",
                      "completed",
                      "failed",
                      "queued",
                      "blocked",
                      "cancelled",
                    ] as WorkflowExecutionStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setInteractiveWorkflowStatus(st)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-colors cursor-pointer",
                        interactiveWorkflowStatus === st
                          ? "bg-[#0d4a36] text-white font-semibold"
                          : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-100"
                      )}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-stone-600">Variant:</span>
                <div className="flex gap-1">
                  {(["badge", "pill", "dot-only", "expanded"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setInteractiveIndicatorVariant(v)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] capitalize transition-colors cursor-pointer",
                        interactiveIndicatorVariant === v
                          ? "bg-stone-800 text-white font-semibold"
                          : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-100"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-stone-600">Attempt Count:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((att) => (
                    <button
                      key={att}
                      type="button"
                      onClick={() => setInteractiveRetryAttempt(att)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer",
                        interactiveRetryAttempt === att
                          ? "bg-amber-600 text-white font-semibold"
                          : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-100"
                      )}
                    >
                      {att}/{interactiveMaxRetries}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Preview */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-2">
              <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
                Active Interactive Render
              </span>
              <div className="flex items-center gap-3">
                <WorkflowStatusIndicator
                  status={interactiveWorkflowStatus}
                  retryAttempt={interactiveRetryAttempt}
                  maxRetries={interactiveMaxRetries}
                  variant={interactiveIndicatorVariant}
                />
              </div>
            </div>

            {/* All Statuses At-A-Glance Gallery */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">IN PROGRESS</span>
                <WorkflowStatusIndicator status="in_progress" variant="badge" />
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">RETRYING (2/3)</span>
                <WorkflowStatusIndicator status="retrying" retryAttempt={2} maxRetries={3} variant="badge" />
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">COMPLETED</span>
                <WorkflowStatusIndicator status="completed" variant="badge" />
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">FAILED</span>
                <WorkflowStatusIndicator status="failed" variant="badge" />
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">QUEUED</span>
                <WorkflowStatusIndicator status="queued" variant="badge" />
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">ACTION REQUIRED</span>
                <WorkflowStatusIndicator status="blocked" variant="badge" />
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">CANCELLED</span>
                <WorkflowStatusIndicator status="cancelled" variant="badge" />
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white space-y-1">
                <span className="text-[10px] text-stone-400 font-mono block">LIVE DOT INDICATOR</span>
                <div className="flex items-center gap-2 pt-1">
                  <WorkflowStatusIndicator status="in_progress" variant="dot-only" />
                  <span className="text-xs text-stone-600">Active Handshake</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7.2 Actor Attribution: AI vs Human Indicators */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <span className="text-xs font-semibold text-stone-900 block">
              7.2 Actor Indicators: AI Autonomous vs. Human Broker Attribution
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Indicator Showcase */}
              <div className="space-y-2 p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#0d4a36]" />
                    <span>AI Autonomous Execution</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setInteractiveAILive((prev) => !prev)}
                    className="text-[10px] font-medium text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Toggle Live Pulse: {interactiveAILive ? "ON" : "OFF"}
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  <AIActivityIndicator
                    actor={{
                      type: "ai_agent",
                      name: "Spacia Voice Core",
                      role: "Autonomous Sales Associate",
                      modelIdentifier: "Neural Executive v2.4 (Lagos)",
                      latencyMs: 380,
                      confidenceScore: 96,
                    }}
                    variant="detailed"
                    isLive={interactiveAILive}
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-stone-500">Badge variant:</span>
                    <AIActivityIndicator
                      actor={{
                        type: "ai_agent",
                        name: "Spacia Voice Core",
                        role: "Autonomous Sales Associate",
                        modelIdentifier: "Neural Executive v2.4",
                      }}
                      variant="badge"
                      isLive={interactiveAILive}
                    />
                  </div>
                </div>
              </div>

              {/* Human Broker Indicator Showcase */}
              <div className="space-y-2 p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/20">
                <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-700" />
                  <span>Human Broker Intervention &amp; Takeover</span>
                </span>

                <div className="space-y-2 pt-1">
                  <HumanActivityIndicator
                    actor={{
                      type: "human_broker",
                      name: "Tunde Bakare",
                      role: "Senior Sales Associate",
                      territory: "Lekki Phase 1 & Ikate",
                      verifiedBadge: true,
                      takeoverReason: "Client requested direct escrow bank wire instructions.",
                    }}
                    variant="detailed"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-stone-500">Badge variant:</span>
                    <HumanActivityIndicator
                      actor={{
                        type: "human_broker",
                        name: "Tunde Bakare",
                        role: "Senior Sales Associate",
                        verifiedBadge: true,
                      }}
                      variant="badge"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7.3 Resilient Retry & Failure Recovery Component */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">
                7.3 Resilient Retry &amp; Failure Recovery State
              </span>
              <span className="text-[11px] text-stone-500">
                Interactive countdown, error code categorization, and one-click recovery
              </span>
            </div>

            <WorkflowRetryState
              workflowId="wf_showcase_01"
              retry={{
                currentAttempt: 2,
                maxRetries: 3,
                backoffSeconds: 45,
                isRetrying: true,
                canManuallyRetry: true,
              }}
              failure={{
                errorCode: "SIP_486_BUSY_SUBSCRIBER",
                errorMessage:
                  "Target mobile carrier returned busy / packet drop during voice payload handshake.",
                technicalDetails:
                  "SIP/2.0 486 Busy Here\nCarrier: MTN Nigeria Core (Victoria Island Switch)\nCall-ID: c89012-421@telephony.spacia.ai\nRetry-After: 45",
                recoverable: true,
                suggestedAction:
                  "System scheduled automated retry attempt 3 of 3 with alternate carrier route.",
                failedAt: "10:45 AM WAT",
              }}
              onRetry={async (id) => {
                await new Promise((r) => setTimeout(r, 600));
                toast.success("Retry Handshake Dispatched", {
                  description: `Dispatched carrier reconnect for workflow ${id}.`,
                });
              }}
              onEscalate={async (id) => {
                toast.info("Escalation Recorded", {
                  description: `Workflow ${id} marked for priority broker callback.`,
                });
              }}
            />
          </div>

          {/* 7.4 Standalone Polymorphic Activity Event Card */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">
                7.4 Polymorphic Activity Event Card
              </span>
              <span className="text-[11px] text-stone-500">
                Multi-channel touchpoints with actor indicators, duration, and expandable payloads
              </span>
            </div>

            <ActivityEventCard
              event={{
                id: "evt_primitives_demo",
                workflowId: "wf_primitives_01",
                title: "Autonomous Voice Qualification Completed",
                description:
                  "Spacia Voice Core engaged prospect for 4m 18s. Verified budget of ₦850,000,000 via corporate equity liquidation.",
                category: "voice_call",
                status: "completed",
                actor: {
                  type: "ai_agent",
                  name: "Spacia Voice Core",
                  role: "Autonomous Sales Associate",
                  modelIdentifier: "Neural Executive v2.4 (Lagos)",
                  latencyMs: 380,
                  confidenceScore: 96,
                },
                timestamp: "12 mins ago",
                channel: "Telephony Voice Core",
                payload: {
                  duration: "4m 18s",
                  outcome: "HOT Qualified (92/100)",
                  transcriptSnippet:
                    "AI: 'Good afternoon Dr. Adeleke, I have the Governor's Consent deed on file for the Admiralty Way villa. What timeline are you targeting for completion?'\nProspect: 'My firm is closing a funding round this quarter, so we can settle in 30 days.'",
                },
              }}
              defaultExpanded={true}
            />
          </div>

          {/* 7.5 Live Operational Automation Event Feed */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">
                7.5 Live Operational Automation Feed
              </span>
              <span className="text-[11px] text-stone-500">
                Filter by All, AI, Human, or Alerts. Click &apos;Simulate Async Event&apos; to test live updates.
              </span>
            </div>

            <AutomationEventFeed showControls={true} />
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 8. AI CONFIDENCE & INTENT UI PRIMITIVES (DAY 9) */}
      {/* ========================================================================= */}
      <Card className="border-border bg-white shadow-2xs">
        <CardHeader className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#0d4a36]" />
              <CardTitle className="text-sm font-semibold text-stone-900">
                8. AI Confidence &amp; Intent UI Primitives (Day 9)
              </CardTitle>
            </div>
            <span className="text-[10px] font-semibold text-[#0d4a36] bg-[#0d4a36]/5 px-2 py-0.5 rounded-full border border-[#0d4a36]/20">
              PRD Sections 14, 38 &amp; 40
            </span>
          </div>
          <CardDescription className="text-xs text-stone-500 mt-1">
            Standardized atomic design tokens for displaying AI qualification confidence, extracted buyer intent categories, and conversational qualification signals.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-6">
          {/* 8.1 Intent Confidence Gauge */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-stone-900">
                  8.1 Interactive Intent Confidence Gauge
                </span>
                <p className="text-[11px] text-stone-500">
                  Color-calibrated certainty tiers: Emerald (&ge;85% High), Amber (60&ndash;84% Moderate), Rose (&lt;60% Low).
                </p>
              </div>

              {/* Slider Controller */}
              <div className="flex items-center gap-3 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
                <span className="text-[11px] font-medium text-stone-600">Test Score:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={interactiveConfidence}
                  onChange={(e) => setInteractiveConfidence(Number(e.target.value))}
                  className="w-28 sm:w-36 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#0d4a36]"
                />
                <span className="text-xs font-bold tabular-nums text-stone-900 w-8">
                  {interactiveConfidence}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/50 space-y-2">
                <span className="text-[11px] font-medium text-stone-500">Standard / Large Meter</span>
                <IntentConfidenceGauge score={interactiveConfidence} />
              </div>

              <div className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/50 space-y-2">
                <span className="text-[11px] font-medium text-stone-500">Compact Inline Variant (Tables &amp; Cards)</span>
                <div className="pt-2 flex items-center gap-4">
                  <IntentConfidenceGauge score={interactiveConfidence} size="sm" />
                  <IntentConfidenceGauge score={88} size="sm" />
                  <IntentConfidenceGauge score={68} size="sm" />
                  <IntentConfidenceGauge score={42} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* 8.2 Buyer Intent Badges */}
          <div className="space-y-3 pt-2">
            <div className="space-y-0.5 border-b border-stone-100 pb-2">
              <span className="text-xs font-semibold text-stone-900">
                8.2 Buyer Intent Classification Badges
              </span>
              <p className="text-[11px] text-stone-500">
                Domain categories mapped from real estate voice qualification conversations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(Object.keys(BUYER_INTENT_META) as BuyerIntentCategory[]).map((category) => (
                <BuyerIntentBadge key={category} category={category} size="md" />
              ))}
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-medium text-stone-500 block mb-1.5">Size Variants</span>
              <div className="flex items-center gap-2">
                <BuyerIntentBadge category="high_purchase_intent" size="sm" />
                <BuyerIntentBadge category="high_purchase_intent" size="md" />
                <BuyerIntentBadge category="high_purchase_intent" size="lg" />
              </div>
            </div>
          </div>

          {/* 8.3 Intent Signal Pills */}
          <div className="space-y-3 pt-2">
            <div className="space-y-0.5 border-b border-stone-100 pb-2">
              <span className="text-xs font-semibold text-stone-900">
                8.3 Extracted Intent Signal Pills
              </span>
              <p className="text-[11px] text-stone-500">
                Extracted NLP entities with signal strength indicator dots (High = Emerald, Medium = Amber, Low = Stone).
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <IntentSignalPill
                signal={{
                  id: "sig-demo-1",
                  type: "budget",
                  label: "Budget ₦400M+ Verified",
                  strength: "high",
                  evidence: "Confirmed liquid allocation for Eko Atlantic penthouse",
                }}
              />
              <IntentSignalPill
                signal={{
                  id: "sig-demo-2",
                  type: "timeline",
                  label: "14-Day Close Window",
                  strength: "high",
                  evidence: "Wants deed signed before fiscal quarter close",
                }}
              />
              <IntentSignalPill
                signal={{
                  id: "sig-demo-3",
                  type: "authority",
                  label: "Sole Decision Maker",
                  strength: "high",
                  evidence: "Signing authority confirmed",
                }}
              />
              <IntentSignalPill
                signal={{
                  id: "sig-demo-4",
                  type: "property_fit",
                  label: "Ikoyi / Banana Island Only",
                  strength: "medium",
                  evidence: "Refused mainland or non-island proposals",
                }}
              />
              <IntentSignalPill
                signal={{
                  id: "sig-demo-5",
                  type: "objection",
                  label: "Title Deeds Verification Required",
                  strength: "low",
                  evidence: "Wants Governor's Consent copy prior to commitment",
                }}
              />
            </div>
          </div>

          {/* 8.4 Full Buyer Intent Evaluation Card */}
          <div className="space-y-3 pt-2">
            <div className="space-y-0.5 border-b border-stone-100 pb-2">
              <span className="text-xs font-semibold text-stone-900">
                8.4 Synthesized Buyer Intent Card Component
              </span>
              <p className="text-[11px] text-stone-500">
                Composite presentation combining confidence meter, classification badge, extracted signals, and next action dispatch.
              </p>
            </div>

            <div className="max-w-xl pt-1">
              <BuyerIntentCard
                evaluation={{
                  id: "eval-showcase",
                  leadId: "lead-showcase-01",
                  leadName: "Senator Femi Balogun",
                  category: "luxury_relocation",
                  intentCategory: "luxury_relocation",
                  confidenceScore: interactiveConfidence,
                  summary:
                    "Looking for turnkey luxury waterfront villa with private mooring in Ikoyi. Liquidity verified (>₦750M). Ready for executive site visit this Friday.",
                  evaluatedAt: new Date().toISOString(),
                  recommendedAction: "Dispatch Private Client VIP Viewing Package & confirm security detail",
                  nextRecommendedAction: "Dispatch Private Client VIP Viewing Package & confirm security detail",
                  signals: [
                    {
                      id: "sig-1",
                      type: "budget",
                      label: "₦750M Verified",
                      strength: "high",
                      evidence: "Private banking verification confirmed",
                    },
                    {
                      id: "sig-2",
                      type: "timeline",
                      label: "This Friday Site Visit",
                      strength: "high",
                      evidence: "Requested 11:00 AM private viewing slot",
                    },
                    {
                      id: "sig-3",
                      type: "property_fit",
                      label: "Ikoyi Waterfront",
                      strength: "high",
                      evidence: "Specific architectural requirement",
                    },
                  ],
                  intentSignals: [
                    {
                      id: "sig-1",
                      type: "budget",
                      label: "₦750M Verified",
                      strength: "high",
                      evidence: "Private banking verification confirmed",
                    },
                    {
                      id: "sig-2",
                      type: "timeline",
                      label: "This Friday Site Visit",
                      strength: "high",
                      evidence: "Requested 11:00 AM private viewing slot",
                    },
                    {
                      id: "sig-3",
                      type: "property_fit",
                      label: "Ikoyi Waterfront",
                      strength: "high",
                      evidence: "Specific architectural requirement",
                    },
                  ],
                }}
                onSelectAction={(leadId, action) => {
                  toast.success(`Action Dispatched for #${leadId.toUpperCase()}`, {
                    description: action,
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 9: DAY 10 — CONVERSATION VISIBILITY & MESSAGING PRIMITIVES */}
      {/* ========================================================================= */}
      <Card className="border-stone-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0d4a36] text-[10px] font-bold text-white">
              9
            </span>
            <CardTitle className="text-sm font-semibold text-stone-900">
              Day 10 — Conversation Visibility & Messaging Primitives
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-stone-500">
            Domain conversation lifecycle states, polymorphic AI vs. Prospect vs. Broker message rendering, and in-timeline real-estate artifacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Part A: Conversation States Taxonomy */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider text-[10px] text-stone-500">
              1. Conversation Lifecycle States
            </h4>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200/70">
              <ConversationStateBadge status="active_ai" />
              <ConversationStateBadge status="awaiting_prospect" />
              <ConversationStateBadge status="qualified" />
              <ConversationStateBadge status="viewing_booked" />
              <ConversationStateBadge status="human_takeover" />
              <ConversationStateBadge status="escalated" />
              <ConversationStateBadge status="closed" />
            </div>
          </div>

          {/* Part B: Polymorphic Message Stream Showcase */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider text-[10px] text-stone-500">
              2. Polymorphic Message Timeline & In-Stream Artifacts
            </h4>
            <div className="p-4 bg-[#fbfbf9] rounded-xl border border-stone-200 space-y-4 max-w-2xl">
              {/* Prospect Message */}
              <ConversationMessageItem
                message={{
                  id: "demo_1",
                  conversationId: "demo",
                  sender: "prospect",
                  senderName: "Chief Raymond Cole",
                  content: "Good afternoon. Is the 5-Bed Smart Villa in Eko Atlantic deeded with a private marina slip?",
                  timestamp: "2026-09-19T04:20:00Z",
                }}
              />

              {/* AI Agent Message with Property Card Artifact */}
              <ConversationMessageItem
                message={{
                  id: "demo_2",
                  conversationId: "demo",
                  sender: "ai_agent",
                  senderName: "Spacia AI Sales Associate",
                  content: "Yes, Chief Cole. The Azuri Peninsula Smart Villa includes a deeded 60-ft private marina berth with 24/7 shore power at ₦450,000,000.",
                  timestamp: "2026-09-19T04:20:45Z",
                  aiMetadata: {
                    model: "Spacia Voice & Chat v2.4",
                    latencyMs: 380,
                    confidence: 96,
                  },
                  artifact: {
                    type: "property_card",
                    propertyTitle: "5-Bed Smart Villa — Eko Atlantic",
                    propertyPrice: "₦450,000,000",
                    propertyLocation: "Azuri Peninsula, Eko Atlantic, Lagos",
                    propertyImage: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80",
                    bedrooms: 5,
                    bathrooms: 6,
                    squareMeters: 680,
                  },
                }}
              />

              {/* AI Agent Message with BANT Qualification Gate Artifact */}
              <ConversationMessageItem
                message={{
                  id: "demo_3",
                  conversationId: "demo",
                  sender: "ai_agent",
                  senderName: "Spacia AI Sales Associate",
                  content: "Underwriting criteria met. Bank draft liquidity verified for Q3 acquisition window.",
                  timestamp: "2026-09-19T04:22:00Z",
                  aiMetadata: {
                    model: "Spacia Voice & Chat v2.4",
                    latencyMs: 410,
                    confidence: 98,
                  },
                  artifact: {
                    type: "bant_milestone",
                    milestoneTitle: "BANT Qualification Gate Passed",
                    milestoneScore: 95,
                    milestoneDetails: "Budget: ₦450M Verified • Authority: Sole • Need: Deeded Slip • Timeline: < 14 Days",
                  },
                }}
              />

              {/* System Takeover Event */}
              <ConversationMessageItem
                message={{
                  id: "demo_4",
                  conversationId: "demo",
                  sender: "system",
                  senderName: "System",
                  content: "Broker takeover executed by Marcus Vance. AI autonomous responses paused.",
                  timestamp: "2026-09-19T04:25:00Z",
                }}
              />

              {/* Human Broker Direct Message */}
              <ConversationMessageItem
                message={{
                  id: "demo_5",
                  conversationId: "demo",
                  sender: "human_broker",
                  senderName: "Marcus Vance",
                  content: "Good morning Chief Cole. Marcus Vance here. I have registered your security clearance at the Azuri security gate for tomorrow's inspection.",
                  timestamp: "2026-09-19T04:26:00Z",
                  deliveryStatus: "delivered",
                }}
              />

              {/* Viewing Appointment Invite Artifact */}
              <ConversationMessageItem
                message={{
                  id: "demo_6",
                  conversationId: "demo",
                  sender: "ai_agent",
                  senderName: "Spacia AI Sales Associate",
                  content: "VIP Physical viewing confirmed on connected calendar.",
                  timestamp: "2026-09-19T04:27:00Z",
                  artifact: {
                    type: "viewing_invite",
                    viewingDate: "Saturday, Sep 20, 2026",
                    viewingTime: "11:30 AM (WAT)",
                    viewingLocation: "Plot 14, Azuri Peninsula, Eko Atlantic",
                    viewingBroker: "Marcus Vance",
                    viewingStatus: "confirmed",
                  },
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 10: DAY 11 — QUALIFICATION VISIBILITY & UNDERWRITING PRIMITIVES */}
      <Card className="border-border bg-white shadow-2xs">
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-stone-900">
                  Day 11 — Qualification Visibility & Autonomous Underwriting
                </CardTitle>
                <Badge variant="live" className="text-[10px]">
                  Day 11 Primitives
                </Badge>
              </div>
              <CardDescription className="text-xs text-stone-500 mt-1">
                Multi-dimensional buyer underwriting panel featuring budget analysis, buyer intent tier, timeline velocity, root motivation, decision readiness, interactive objections, AI confidence telemetry, and explainable algorithmic score breakdown.
              </CardDescription>
            </div>

            {/* Interactive Scenario Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg border border-stone-200 text-xs overflow-x-auto">
              {[
                { id: "lead_01", label: "Adeleke (Hot 92)" },
                { id: "lead_02", label: "Jenkins (Warm 88)" },
                { id: "lead_04", label: "Eze (Exploratory 68)" },
                { id: "lead_05", label: "Okafor (Hot 95)" },
              ].map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setSelectedQualificationLeadId(scenario.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium text-xs transition-all whitespace-nowrap cursor-pointer",
                    selectedQualificationLeadId === scenario.id
                      ? "bg-white text-stone-900 shadow-xs font-semibold"
                      : "text-stone-600 hover:text-stone-900"
                  )}
                >
                  <span>{scenario.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 bg-stone-50/50">
          <div className="max-w-3xl mx-auto">
            <QualificationPanel lead={activeQualificationLead} />
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 11. CALL VISIBILITY & VOICE INTELLIGENCE PRIMITIVES (DAY 12) */}
      {/* ========================================================================= */}
      <Card id="calls" className="border-border bg-white shadow-2xs scroll-mt-20">
        <CardHeader className="p-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#0d4a36]" />
            <CardTitle className="text-sm font-semibold text-stone-900">
              Day 12 — Call Visibility &amp; Voice Intelligence Primitives
            </CardTitle>
            <Badge variant="live" className="text-[10px] px-1.5 py-0">
              Phase 1 Live
            </Badge>
          </div>
          <CardDescription className="text-xs text-stone-500">
            Suite of audio playback controls, waveform scrubbers, recording states, outcome taxonomy, speech metrics, and click-to-seek transcript viewers.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-6">
          {/* A. Recording State Taxonomy */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-900 block">
              1. Call Recording State Indicators
            </span>
            <div className="flex flex-wrap gap-2 items-center">
              <CallRecordingBadge state="ready" />
              <CallRecordingBadge state="processing" />
              <CallRecordingBadge state="live" />
              <CallRecordingBadge state="failed" />
              <CallRecordingBadge state="no_audio" />
            </div>
          </div>

          {/* B. Call Outcome Taxonomy */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-900 block">
              2. Call Outcome Taxonomy
            </span>
            <div className="flex flex-wrap gap-2 items-center">
              <CallOutcomeBadge outcome="viewing_booked" />
              <CallOutcomeBadge outcome="qualified" />
              <CallOutcomeBadge outcome="callback_requested" />
              <CallOutcomeBadge outcome="nurture" />
              <CallOutcomeBadge outcome="escalated_takeover" />
              <CallOutcomeBadge outcome="voicemail" />
            </div>
          </div>

          {/* C. Duration & Speech Metrics Strip */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-900 block">
              3. Call Duration &amp; Talk-to-Listen Ratio
            </span>
            <CallMetricsStrip metrics={MOCK_CALLS[0].metrics} />
          </div>

          {/* D. Interactive Waveform Audio Player */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-900 block">
              4. Interactive Audio Player &amp; Waveform Scrubber
            </span>
            <CallAudioPlayer
              callId={MOCK_CALLS[0].id}
              leadName={MOCK_CALLS[0].leadName}
              recordingState={MOCK_CALLS[0].recordingState}
              durationSeconds={MOCK_CALLS[0].audioDurationSeconds}
            />
          </div>

          {/* E. Executive Summary Card */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-900 block">
              5. Structured Executive AI Call Summary
            </span>
            <CallSummaryCard
              summary={MOCK_CALLS[0].summary}
              leadName={MOCK_CALLS[0].leadName}
            />
          </div>

          {/* F. Click-to-Seek Transcript Viewer */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-900 block">
              6. Interactive Dialogue Transcript (Click Turn to Seek)
            </span>
            <TranscriptViewer
              transcript={MOCK_CALLS[0].transcript}
              onSeekToTimestamp={(sec) => {
                toast.info("Seeking Audio", {
                  description: `Jumped to timestamp ${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}.`,
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 12. HUMAN-IN-THE-LOOP SUPERVISION & AI CONTROL SUITE (DAY 13) */}
      {/* ========================================================================= */}
      <Card id="supervision" className="border-border bg-white shadow-2xs scroll-mt-20">
        <CardHeader className="p-4 border-b border-stone-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#0d4a36]" />
                <CardTitle className="text-sm font-semibold text-stone-900">
                  Day 13 — Human-in-the-Loop Supervision &amp; AI Control Suite
                </CardTitle>
                <Badge variant="live" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-300">
                  Interactive Testbench
                </Badge>
              </div>
              <CardDescription className="text-xs text-stone-500">
                Gives real estate brokers absolute control over autonomous AI. Features 1-click broker takeover, AI killswitch/resume, disposition workflows (Nurture / Lost), and intelligent handoff context with actionable directives.
              </CardDescription>
            </div>

            {/* Scenario Selector */}
            <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 self-start sm:self-auto overflow-x-auto max-w-full">
              {[
                { id: "lead_01", label: "Adeleke (Autonomous AI)" },
                { id: "lead_02", label: "Chief Cole (Human Managed)" },
                { id: "lead_03", label: "Dr. Okafor (Nurture)" },
                { id: "lead_05", label: "Ibrahim (Marked Lost)" },
              ].map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setSelectedDay13LeadId(scenario.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium text-xs transition-all whitespace-nowrap cursor-pointer",
                    selectedDay13LeadId === scenario.id
                      ? "bg-white text-stone-900 shadow-xs font-semibold"
                      : "text-stone-600 hover:text-stone-900"
                  )}
                >
                  <span>{scenario.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6 bg-stone-50/50">
          {/* Active Lead Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-lg border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#0d4a36]/10 text-[#0d4a36] font-semibold text-xs flex items-center justify-center border border-[#0d4a36]/20">
                {activeDay13Lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-stone-900">{activeDay13Lead.name}</span>
                  <StatusBadge status={activeDay13Lead.status} withDot />
                  {activeDay13Lead.isAiStopped && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-mono">
                      AI Paused
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-2">
                  <span>{activeDay13Lead.propertyTitle}</span>
                  <span>•</span>
                  <span className="font-mono">{activeDay13Lead.budget}</span>
                  {activeDay13Lead.assignedBroker && (
                    <>
                      <span>•</span>
                      <span className="text-sky-700 font-medium">Assigned: {activeDay13Lead.assignedBroker}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-white cursor-pointer"
              onClick={() => {
                const original = MOCK_LEADS.find((l) => l.id === activeDay13Lead.id);
                if (original) {
                  setDay13Leads((prev) => prev.map((l) => (l.id === activeDay13Lead.id ? { ...original } : l)));
                  toast.info("State Reset", { description: `Reset ${original.name} to default initial state.` });
                }
              }}
            >
              Reset Scenario State
            </Button>
          </div>

          {/* Primary Interactive Cockpit */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-900 block">
              1. Full Human Supervision Cockpit (All Actions Live)
            </span>
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
              <HumanSupervisionCockpit
                lead={activeDay13Lead}
                onTakeover={(brokerName, reason) => handleDay13Takeover(activeDay13Lead.id, brokerName, reason)}
                onStopAI={(reason) => handleDay13StopAI(activeDay13Lead.id, reason)}
                onResumeAI={() => handleDay13ResumeAI(activeDay13Lead.id)}
                onMarkNurture={(schedule, notes) => handleDay13MarkNurture(activeDay13Lead.id, schedule, notes)}
                onMarkLost={(lossDetails) => handleDay13MarkLost(activeDay13Lead.id, lossDetails)}
                onUpdateSchedule={(schedule) => handleDay13UpdateSchedule(activeDay13Lead.id, schedule)}
              />
            </div>
          </div>

          {/* Standalone Primitives Display Grid */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-stone-900 block">
              2. Granular Briefing &amp; Action Subcomponents
            </span>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Context */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1">
                  <FileQuestion className="h-3.5 w-3.5 text-stone-400" />
                  HandoffContextCard
                </span>
                {activeDay13Lead.handoffContext ? (
                  <HandoffContextCard handoff={activeDay13Lead.handoffContext} />
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-white text-center text-xs text-stone-400">
                    No handoff context generated yet. Click &quot;Take Over&quot; in the cockpit above to simulate an emergency handoff.
                  </div>
                )}
              </div>

              {/* Recommended Action */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  RecommendedActionCard
                </span>
                {activeDay13Lead.recommendedAction ? (
                  <RecommendedActionCard
                    action={activeDay13Lead.recommendedAction}
                    leadPhone={activeDay13Lead.phone}
                    leadEmail={activeDay13Lead.email}
                    leadName={activeDay13Lead.name}
                  />
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-white text-center text-xs text-stone-400">
                    No active broker directive for this lead.
                  </div>
                )}
              </div>

              {/* Follow-Up Schedule */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5 text-stone-400" />
                  FollowUpScheduleCard
                </span>
                {activeDay13Lead.followUpSchedule ? (
                  <FollowUpScheduleCard
                    schedule={activeDay13Lead.followUpSchedule}
                    onUpdateSchedule={(schedule) => handleDay13UpdateSchedule(activeDay13Lead.id, schedule)}
                  />
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-stone-200 bg-white text-center text-xs text-stone-400">
                    No follow-up scheduled. Mark as Nurture to create a schedule.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 13. AVAILABILITY SELECTOR & REAL AVAILABLE SLOT PRIMITIVE (DAY 16) */}
      {/* ========================================================================= */}
      <Card className="border-border bg-white shadow-2xs">
        <CardHeader className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#0d4a36]" />
              <CardTitle className="text-sm font-semibold text-stone-900">
                13. Availability Selector & Real Available Slot (Day 16)
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-800 border-emerald-200 bg-emerald-50">
              Google Calendar Free/Busy Engine
            </Badge>
          </div>
          <CardDescription className="text-xs text-stone-500 mt-1">
            Real-time viewing slot calculation checking internal booking collisions and external Google Calendar busy intervals.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <AvailabilitySelector
            propertyId="prop_lekki_01"
            selectedDate={testAvailabilityDate}
            onDateChange={setTestAvailabilityDate}
            selectedSlotId={testAvailabilitySlot?.id}
            onSelectSlot={(slot: ViewingSlot) => {
              setTestAvailabilitySlot(slot);
              toast.success("Real Available Slot Selected!", {
                description: `${slot.formattedTime} on ${slot.formattedDate} (${slot.brokerName || "Assigned Broker"})`,
              });
            }}
          />

          {testAvailabilitySlot && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <span>Selected Inspection Window: {testAvailabilitySlot.formattedTime}</span>
                </span>
                <p className="text-[11px] text-emerald-800">
                  Date: {testAvailabilitySlot.formattedDate} • Broker: {testAvailabilitySlot.brokerName || "Ade Admin"}
                </p>
              </div>
              <Badge className="bg-[#0d4a36] text-white hover:bg-[#0a3829] text-[10px]">
                Real Available Slot
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 14. BOOKING NOTIFICATIONS & VIEWING REMINDERS */}
      {/* ========================================================================= */}
      <Card className="border-border bg-white shadow-2xs">
        <CardHeader className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#0d4a36]" />
              <CardTitle className="text-sm font-semibold text-stone-900">
                14. Booking Notifications &amp; Viewing Reminders
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-800 border-emerald-200 bg-emerald-50">
              Notification Engine
            </Badge>
          </div>
          <CardDescription className="text-xs text-stone-500 mt-1">
            Multi-party inspection notifications: prospect confirmation, 24h/1h viewing reminders, and company AI briefing alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prospect Notification Card */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#0d4a36]" />
                  <span>Prospect Notification Channel</span>
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
                  Delivered
                </Badge>
              </div>
              <p className="text-[11px] text-stone-500">
                Includes branded luxury walkthrough confirmation, assigned closer contact, Google Meet video bridge, and one-click calendar invitation.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSendingPrimitiveReminder}
                  onClick={async () => {
                    setIsSendingPrimitiveReminder(true);
                    try {
                      await appointmentsService.sendViewingReminder("demo_apt_01", "24h");
                      setReminderDispatched("24h viewing reminder dispatched to prospect");
                      toast.success("24h Viewing Reminder Dispatched");
                    } finally {
                      setIsSendingPrimitiveReminder(false);
                    }
                  }}
                  className="h-7 gap-1.5 text-xs bg-white border-stone-200 text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
                >
                  <Bell className="h-3 w-3 text-amber-600" />
                  <span>Dispatch 24h Reminder</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSendingPrimitiveReminder}
                  onClick={async () => {
                    setIsSendingPrimitiveReminder(true);
                    try {
                      await appointmentsService.sendViewingReminder("demo_apt_01", "1h");
                      setReminderDispatched("1h urgent viewing reminder dispatched to prospect");
                      toast.success("1h Urgent Viewing Reminder Dispatched");
                    } finally {
                      setIsSendingPrimitiveReminder(false);
                    }
                  }}
                  className="h-7 gap-1.5 text-xs bg-white border-stone-200 text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
                >
                  <BellRing className="h-3 w-3 text-rose-600" />
                  <span>Dispatch 1h Urgent Reminder</span>
                </Button>
              </div>
            </div>

            {/* Company Underwriting Alert Card */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Company / Closer Alert Channel</span>
                </span>
                <Badge className="bg-[#0d4a36] text-white hover:bg-[#0a3829] text-[10px]">
                  Internal Briefing
                </Badge>
              </div>
              <p className="text-[11px] text-stone-500">
                Dispatches high-stakes sales intelligence to senior closer: BANT liquidity score (HOT 94/100), asking valuation (₦950M), projected commission (₦47.5M), and AI negotiation synthesis.
              </p>
              <div className="rounded-md border border-stone-200/80 bg-white p-2 text-[11px] text-stone-600 space-y-1 font-mono">
                <div>Recipient: <span className="font-semibold text-stone-900">closers@spacia.io</span></div>
                <div>Status: <span className="text-emerald-700 font-semibold">Active & Synced</span></div>
              </div>
            </div>
          </div>

          {reminderDispatched && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>{reminderDispatched}</span>
              </span>
              <Badge className="bg-[#0d4a36] text-white text-[10px]">
                Delivered
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* DIALOG & DRAWER INSTANCES */}
      {/* ========================================================================= */}
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Initiate Immediate Broker Takeover?"
        description="This will pause autonomous AI voice qualification for this lead and transfer direct call routing to your personal mobile line."
        confirmText="Take Over Call"
        variant="destructive"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600));
          toast.success("Broker Takeover Active", {
            description: "Direct call stream transferred to sales associate.",
          });
        }}
      />

      {selectedLead && (
        <DetailDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          title={selectedLead.name}
          description={selectedLead.property}
          badge={<StatusBadge status={selectedLead.status} withDot />}
          icon={<Building className="h-4 w-4 text-emerald-200" />}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-stone-700 bg-white"
                onClick={() => setIsDrawerOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-[#0d4a36] text-white hover:bg-[#0a3829]"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsConfirmOpen(true);
                }}
              >
                Broker Takeover
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
                <span className="text-[11px] text-stone-500">Phone Number</span>
                <p className="font-mono font-semibold text-stone-900 mt-0.5">{selectedLead.phone}</p>
              </div>
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
                <span className="text-[11px] text-stone-500">Verified Budget</span>
                <p className="font-mono font-semibold text-stone-900 mt-0.5">{selectedLead.budget}</p>
              </div>
            </div>

            <ScoreIndicator score={selectedLead.score} variant="breakdown" />
          </div>
        </DetailDrawer>
      )}
    </Container>
  );
}
