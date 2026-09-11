"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadIntakeTable } from "@/features/dashboard/components/lead-intake-table";
import { MOCK_DASHBOARD_LEADS } from "@/features/dashboard/data/mock-data";
import { useWorkspace } from "@/lib/context/workspace-context";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
  X,
  Building,
  User,
  Phone,
  Mail,
  DollarSign,
  MapPin,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { exportLeadsToCSV } from "@/lib/utils/export-csv";
import type { DashboardLead } from "@/features/dashboard/types";
import { cn } from "@/lib/utils/cn";

const ITEMS_PER_PAGE = 5;

export default function LeadsPage() {
  const { currentWorkspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "loading" | "success">("idle");
  const [isExporting, setIsExporting] = React.useState(false);

  // New Lead Form State
  const [newLead, setNewLead] = React.useState({
    name: "",
    phone: "",
    email: "",
    propertyTitle: "",
    location: "",
    budget: "",
    intent: "Purchase" as "Purchase" | "Rental" | "Investment",
    timeline: "< 30 days",
  });
  const [leadList, setLeadList] = React.useState<DashboardLead[]>(MOCK_DASHBOARD_LEADS);

  // Filtering
  const filteredLeads = React.useMemo(() => {
    return leadList.filter((lead) => {
      const matchesSearch =
        !searchTerm.trim() ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || lead.scoreCategory === selectedCategory;

      const matchesStatus =
        selectedStatus === "ALL" || lead.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [leadList, searchTerm, selectedCategory, selectedStatus]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLeads = React.useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeads, validCurrentPage]);

  const handleExport = () => {
    setIsExporting(true);
    const leadsToExport = filteredLeads.length > 0 ? filteredLeads : leadList;
    const result = exportLeadsToCSV(leadsToExport, currentWorkspace?.name || "pacia-workspace");

    if (result) {
      toast.success("CSV Export Complete", {
        description: `Exported ${result.count} prospects to ${result.filename}.`,
      });
    } else {
      toast.error("No prospects available to export.");
    }

    setTimeout(() => {
      setIsExporting(false);
    }, 500);
  };

  const handleManualIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.phone) return;

    setSubmitStatus("loading");
    setTimeout(() => {
      const created: DashboardLead = {
        id: `lead_${Date.now()}`,
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email || "client@direct.ng",
        propertyTitle: newLead.propertyTitle || "Direct Broker Inquiry",
        location: newLead.location || "Lagos",
        budget: newLead.budget || "₦75,000,000",
        score: 85,
        scoreCategory: "HOT",
        status: "New",
        intent: newLead.intent,
        timeline: newLead.timeline,
        nextAction: "AI Voice Qualification Triggered",
        createdAt: "Just now",
        aiNotes: "Manual broker intake recorded. Autonomous follow-up dispatched.",
      };

      setLeadList((prev) => [created, ...prev]);
      setSubmitStatus("success");

      // Trigger user-requested success toast
      toast.success("Lead Ingested Successfully", {
        description: `${created.name} (${created.phone}) has been enrolled into autonomous AI qualification.`,
      });

      // Allow brief moment for user to see the success state before closing drawer
      setTimeout(() => {
        setIsDrawerOpen(false);
        setSubmitStatus("idle");
        setNewLead({
          name: "",
          phone: "",
          email: "",
          propertyTitle: "",
          location: "",
          budget: "",
          intent: "Purchase",
          timeline: "< 30 days",
        });
      }, 900);
    }, 700);
  };

  return (
    <Container size="lg" className="space-y-4">
      <PageHeader
        title="Leads"
        description={`Inbound property inquiries and qualification pipeline for ${currentWorkspace?.name || "your workspace"}.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-8 gap-1.5 text-xs text-stone-700 bg-white hover:bg-stone-50 cursor-pointer shadow-2xs"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-600" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-stone-500" />
                  <span>Export CSV</span>
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              className="h-8 gap-1.5 bg-[#0d4a36] text-white hover:bg-[#0a3829] text-xs cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Manual Lead Intake</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
          <Input
            placeholder="Search leads by name, property, or location..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 h-8 text-xs bg-stone-50 border-stone-200"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Qualification Score Select Filter */}
          <div className="w-32">
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200">
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Scores</SelectItem>
                <SelectItem value="HOT">HOT (80+)</SelectItem>
                <SelectItem value="WARM">WARM (60-79)</SelectItem>
                <SelectItem value="COLD">COLD (&lt;60)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operational Status Select Filter */}
          <div className="w-38">
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                setSelectedStatus(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="In Conversation">In Conversation</SelectItem>
                <SelectItem value="Viewing Booked">Viewing Booked</SelectItem>
                <SelectItem value="Contacting">Contacting</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters button if any filter is active */}
          {(selectedCategory !== "ALL" || selectedStatus !== "ALL" || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedStatus("ALL");
                setSearchTerm("");
              }}
              className="h-8 text-xs text-stone-500 hover:text-stone-900 px-2"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Reusable Lead Intake Table with hideViewAll=true on this page */}
      <LeadIntakeTable
        leads={paginatedLeads}
        hideViewAll={true}
      />

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-stone-500">
          Showing <span className="font-medium text-stone-800">{paginatedLeads.length ? (validCurrentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to{" "}
          <span className="font-medium text-stone-800">
            {Math.min(validCurrentPage * ITEMS_PER_PAGE, filteredLeads.length)}
          </span>{" "}
          of <span className="font-medium text-stone-800">{filteredLeads.length}</span> prospects
        </div>

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Previous"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (validCurrentPage > 1) {
                    setCurrentPage((p) => p - 1);
                  }
                }}
                className={validCurrentPage <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={validCurrentPage === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                  href="#"
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                text="Next"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (validCurrentPage < totalPages) {
                    setCurrentPage((p) => p + 1);
                  }
                }}
                className={validCurrentPage >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Drawer for Manual Lead Intake */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setSubmitStatus("idle");
          }
        }}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d4a36] text-white">
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div>
                    <DrawerTitle>Manual Lead Intake</DrawerTitle>
                    <DrawerDescription>
                      Inject a direct walk-in, phone call, or referral into autonomous AI qualification.
                    </DrawerDescription>
                  </div>
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-400 hover:text-stone-700">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <form onSubmit={handleManualIntakeSubmit} className="p-5 pt-0 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Prospect Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <Input
                      required
                      placeholder="e.g. Chief Adeleke"
                      value={newLead.name}
                      onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                      className="pl-8 h-8.5 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <Input
                      required
                      placeholder="+234 800 000 0000"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="pl-8 h-8.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <Input
                      type="email"
                      placeholder="prospect@email.com"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="pl-8 h-8.5 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Verified Budget Target</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <Input
                      placeholder="₦120,000,000"
                      value={newLead.budget}
                      onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })}
                      className="pl-8 h-8.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Property of Interest</label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <Input
                      placeholder="4-Bed Detached Villa"
                      value={newLead.propertyTitle}
                      onChange={(e) => setNewLead({ ...newLead, propertyTitle: e.target.value })}
                      className="pl-8 h-8.5 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Target Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <Input
                      placeholder="Ikoyi / Lekki Phase 1"
                      value={newLead.location}
                      onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                      className="pl-8 h-8.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Buyer Intent Select */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Buyer Intent</label>
                  <Select
                    value={newLead.intent}
                    onValueChange={(val: "Purchase" | "Rental" | "Investment") =>
                      setNewLead({ ...newLead, intent: val })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs bg-stone-50 border-stone-200">
                      <SelectValue placeholder="Select intent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Purchase">Purchase (Outright / Cash)</SelectItem>
                      <SelectItem value="Rental">Luxury Rental</SelectItem>
                      <SelectItem value="Investment">Off-Plan / Commercial Investment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Decision Timeline Select */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-stone-700">Decision Timeline</label>
                  <Select
                    value={newLead.timeline}
                    onValueChange={(val) => setNewLead({ ...newLead, timeline: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-stone-50 border-stone-200">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate">&lt; 14 days (Urgent)</SelectItem>
                      <SelectItem value="< 30 days">&lt; 30 days</SelectItem>
                      <SelectItem value="< 45 days">&lt; 45 days</SelectItem>
                      <SelectItem value="2-3 months">2-3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Banner */}
              {submitStatus === "success" ? (
                <div className="rounded-lg border border-emerald-300 bg-emerald-100/90 p-2.5 text-xs text-emerald-950 space-y-1 transition-all">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>Lead Successfully Ingested</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    Autonomous qualification workflows and broker notifications have been dispatched.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-950">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Immediate AI Autonomous Action</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    Upon submission, Pacia AI immediately dispatches an introductory WhatsApp qualification sequence and alerts on-duty sales brokers.
                  </p>
                </div>
              )}

              <DrawerFooter className="px-0 pb-0 pt-2 flex flex-row items-center justify-end gap-2">
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitStatus !== "idle"}
                    className="h-8.5 text-xs"
                  >
                    Cancel
                  </Button>
                </DrawerClose>
                <Button
                  type="submit"
                  disabled={submitStatus !== "idle"}
                  size="sm"
                  className={cn(
                    "h-8.5 gap-1.5 text-xs px-4 transition-all duration-200",
                    submitStatus === "success"
                      ? "bg-emerald-600 hover:bg-emerald-600 text-white font-medium"
                      : "bg-[#0d4a36] text-white hover:bg-[#0a3829]"
                  )}
                >
                  {submitStatus === "loading" && (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Ingesting Lead...</span>
                    </>
                  )}
                  {submitStatus === "success" && (
                    <>
                      <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                      <span>Successful!</span>
                    </>
                  )}
                  {submitStatus === "idle" && (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ingest Lead</span>
                    </>
                  )}
                </Button>
              </DrawerFooter>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </Container>
  );
}
