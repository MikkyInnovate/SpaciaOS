"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { StatusBadge, type DomainStatus } from "@/components/ui/status-badge";
import { ScoreIndicator } from "@/components/ui/score-indicator";
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
} from "lucide-react";

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
  const [formNotes, setFormNotes] = React.useState(
    "High net-worth buyer looking for waterfront property with private boat jetty."
  );

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
