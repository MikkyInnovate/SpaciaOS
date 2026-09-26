"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormLabel } from "@/components/ui/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadsService } from "../services/leads-service";
import type { CreateLeadInput, DuplicateMatch, Lead } from "../types";
import { MOCK_PROPERTIES } from "@/features/properties/data/mock-properties";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

interface LeadIntakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadCreated: (lead: Lead) => void;
  onSelectExistingLead?: (leadId: string) => void;
}

const INBOUND_CHANNELS = [
  { value: "Meta Ads", label: "Meta Inbound (Instagram / FB Ads)" },
  { value: "Google Inbound", label: "Google High-Intent Search" },
  { value: "WhatsApp Inbound", label: "WhatsApp Direct Inquiry" },
  { value: "Direct Phone", label: "Direct Phone Inbound" },
  { value: "Broker Referral", label: "Broker Network Referral" },
  { value: "Walk-in", label: "Office / Site Walk-in" },
];

const TIMELINE_OPTIONS = [
  { value: "< 30 days", label: "Immediate (< 30 Days)" },
  { value: "1 - 3 months", label: "Near-Term (1 - 3 Months)" },
  { value: "3 - 6 months", label: "Medium-Term (3 - 6 Months)" },
  { value: "Exploratory", label: "Exploratory / Unhurried" },
];

export function LeadIntakeDialog({
  open,
  onOpenChange,
  onLeadCreated,
  onSelectExistingLead,
}: LeadIntakeDialogProps) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [source, setSource] = React.useState("Meta Ads");
  const [budget, setBudget] = React.useState("₦250,000,000");
  const [propertyTitle, setPropertyTitle] = React.useState(
    MOCK_PROPERTIES[0]?.title || "3-Bedroom Contemporary Flat"
  );
  const [timeline, setTimeline] = React.useState("< 30 days");
  const [intent, setIntent] = React.useState<"Purchase" | "Rental" | "Investment">("Purchase");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Live duplicate detection derived cleanly without cascading effect setState
  const duplicateMatches: DuplicateMatch[] = React.useMemo(() => {
    if (!phone.trim() && !email.trim()) return [];
    return leadsService.detectDuplicates(phone, email).matches;
  }, [phone, email]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setSource("Meta Ads");
    setBudget("₦250,000,000");
    setPropertyTitle(MOCK_PROPERTIES[0]?.title || "3-Bedroom Contemporary Flat");
    setTimeline("< 30 days");
    setIntent("Purchase");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Validation Error", { description: "Prospect name is required." });
      return;
    }
    if (!phone.trim()) {
      toast.error("Validation Error", { description: "Prospect contact phone is required." });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProp = MOCK_PROPERTIES.find((p) => p.title === propertyTitle);

      const payload: CreateLeadInput = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        source,
        budget: budget.trim() || "₦250,000,000",
        propertyTitle,
        location: selectedProp?.location || "Lekki, Lagos",
        intent,
        timeline,
        notes: notes.trim() || undefined,
        forceDuplicate: duplicateMatches.length > 0,
      };

      const createdLead = await leadsService.createLead(payload);

      toast.success("Lead Successfully Ingested", {
        description: `${createdLead.name} registered into active pipeline (${createdLead.scoreCategory} · Score ${createdLead.score}).`,
      });

      onLeadCreated(createdLead);
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to register lead. Please try again.";
      toast.error("Failed to register lead", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJumpToExisting = (leadId: string) => {
    if (onSelectExistingLead) {
      onSelectExistingLead(leadId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 border border-stone-200/80 bg-white shadow-xl rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader className="p-5 pb-4 border-b border-stone-100 bg-[#fcfcfb] text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200/70 text-[#0d4a36] shadow-2xs shrink-0">
                <UserPlus className="h-4.5 w-4.5 text-[#0d4a36]" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-sm font-semibold text-stone-900 tracking-tight">
                  Intake New Prospect
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Register an inbound inquiry, initiate 5-point AI underwriting, and check for duplicates.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {/* Live Duplicate Warning Banner */}
            {duplicateMatches.length > 0 && (
              <div className="rounded-lg border border-amber-200/90 bg-amber-50/80 p-3 text-xs text-amber-950 shadow-2xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-950 text-xs">
                      Potential Duplicate Detected ({duplicateMatches.length} existing record)
                    </p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5">
                      A prospect with matching phone or email is already in your workspace.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-amber-200/60">
                  {duplicateMatches.map((m) => (
                    <div
                      key={m.leadId}
                      className="flex items-center justify-between rounded-md bg-white/90 px-2.5 py-1.5 border border-amber-200/60"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-stone-900 text-xs">{m.leadName}</span>
                        <span className="text-[10px] text-stone-500 ml-1.5">
                          ({m.status} · Score {m.score} {m.scoreCategory})
                        </span>
                        <div className="text-[10px] text-stone-400 truncate">
                          Matched via {m.matchType.toUpperCase()}: {m.propertyTitle}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleJumpToExisting(m.leadId)}
                        className="h-6.5 px-2 text-[11px] text-amber-950 border-amber-300 bg-white hover:bg-amber-50 shrink-0 cursor-pointer font-medium gap-1"
                      >
                        <span>View Dossier</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 1: Full Name & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <FormLabel required htmlFor="lead-name">
                  Full Name
                </FormLabel>
                <Input
                  id="lead-name"
                  placeholder="e.g. Chief Femi Adeleke"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8.5 text-xs border-stone-200 focus-visible:ring-[#0d4a36]/20 focus-visible:border-[#0d4a36]"
                  required
                />
              </FormField>

              <FormField>
                <FormLabel required htmlFor="lead-phone">
                  Phone Number
                </FormLabel>
                <Input
                  id="lead-phone"
                  placeholder="e.g. +234 803 555 0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-8.5 text-xs border-stone-200 focus-visible:ring-[#0d4a36]/20 focus-visible:border-[#0d4a36] font-mono"
                  required
                />
              </FormField>
            </div>

            {/* Row 2: Email & Inbound Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <FormLabel htmlFor="lead-email">
                  Email Address <span className="text-stone-400 font-normal">(Optional)</span>
                </FormLabel>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="e.g. f.adeleke@holding.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8.5 text-xs border-stone-200 focus-visible:ring-[#0d4a36]/20 focus-visible:border-[#0d4a36]"
                />
              </FormField>

              <FormField>
                <FormLabel>Inbound Channel</FormLabel>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-8.5 text-xs border-stone-200 bg-white focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                    <SelectValue placeholder="Select intake channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {INBOUND_CHANNELS.map((ch) => (
                      <SelectItem key={ch.value} value={ch.value} className="text-xs">
                        {ch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Row 3: Budget & Acquisition Intent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <FormLabel htmlFor="lead-budget">
                  Declared Budget Allocation
                </FormLabel>
                <CurrencyInput
                  id="lead-budget"
                  value={budget.replace(/[^\d]/g, "")}
                  onValueChange={(formatted) => setBudget(formatted ? `₦${formatted}` : "")}
                  currencySymbol="₦"
                  placeholder="250,000,000"
                  className="h-8.5 text-xs border-stone-200 font-mono font-semibold focus-visible:ring-[#0d4a36]/20 focus-visible:border-[#0d4a36]"
                />
              </FormField>

              <FormField>
                <FormLabel>Acquisition Intent</FormLabel>
                <Select
                  value={intent}
                  onValueChange={(val) => setIntent(val as "Purchase" | "Rental" | "Investment")}
                >
                  <SelectTrigger className="h-8.5 text-xs border-stone-200 bg-white focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Purchase" className="text-xs">
                      Outright Purchase (Owner-Occupier)
                    </SelectItem>
                    <SelectItem value="Investment" className="text-xs">
                      Commercial Investment / Rental Yield
                    </SelectItem>
                    <SelectItem value="Rental" className="text-xs">
                      Luxury Long-Term Rental
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Row 4: Property Interest & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField>
                <FormLabel>Property of Interest</FormLabel>
                <Select value={propertyTitle} onValueChange={setPropertyTitle}>
                  <SelectTrigger className="h-8.5 text-xs border-stone-200 bg-white truncate focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                    <SelectValue placeholder="Select target property" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PROPERTIES.map((prop) => (
                      <SelectItem key={prop.id} value={prop.title} className="text-xs">
                        <span className="font-medium text-stone-900">{prop.title}</span>
                        <span className="text-stone-400 ml-1.5 font-mono">({prop.formattedPrice})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField>
                <FormLabel>Target Timeline Window</FormLabel>
                <Select value={timeline} onValueChange={setTimeline}>
                  <SelectTrigger className="h-8.5 text-xs border-stone-200 bg-white focus:ring-[#0d4a36]/20 focus:border-[#0d4a36]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Row 5: Notes */}
            <FormField>
              <FormLabel htmlFor="lead-notes">
                Initial Underwriting Notes / Buyer Memo{" "}
                <span className="text-stone-400 font-normal">(Optional)</span>
              </FormLabel>
              <Textarea
                id="lead-notes"
                rows={2}
                placeholder="Specific preferences, requested site visit dates, offshore financing considerations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs border-stone-200 resize-none focus-visible:ring-[#0d4a36]/20 focus-visible:border-[#0d4a36]"
              />
            </FormField>
          </div>

          {/* Footer */}
          <DialogFooter className="p-3.5 px-5 border-t border-stone-100 bg-[#fcfcfb] flex items-center justify-between sm:justify-between">
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              <span>Initial BANT scoring auto-calculated</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-8 text-xs text-stone-600 bg-white hover:bg-stone-50 border-stone-200 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 text-xs bg-[#0d4a36] hover:bg-[#093829] text-white gap-1.5 cursor-pointer shadow-2xs font-medium px-3.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-200" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Register & Initiate Intake</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
