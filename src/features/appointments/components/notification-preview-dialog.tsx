"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "../types";
import {
  Mail,
  Send,
  CalendarDays,
  Clock,
  MapPin,
  KeyRound,
  ShieldCheck,
  Building2,
  Sparkles,
  TrendingUp,
  FileCheck2,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { appointmentsService } from "../services/appointments-service";
import { toast } from "sonner";

interface NotificationPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

export function NotificationPreviewDialog({
  open,
  onOpenChange,
  appointment,
}: NotificationPreviewDialogProps) {
  const [activeTab, setActiveTab] = React.useState<"prospect_conf" | "prospect_remind" | "company_alert">("prospect_conf");
  const [reminderWindow, setReminderWindow] = React.useState<"24h" | "1h">("24h");
  const [isSending, setIsSending] = React.useState(false);

  const start = appointment ? new Date(appointment.startTime) : new Date();
  const end = appointment ? new Date(appointment.endTime) : new Date(Date.now() + 3600000);

  const formattedDate = start.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = `${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  const refCode = appointment?.referenceCode || `SP-BK-${appointment?.id?.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "DEMO01"}`;
  const propertyTitle = appointment?.propertyTitle || "The Grand Waterfront Villa";
  const propertyLocation = appointment?.location || appointment?.propertyLocation || "Zone A, Banana Island, Ikoyi, Lagos";
  const propertyPrice = appointment?.propertyPrice || "₦950,000,000";
  const leadName = appointment?.leadName || "Alhaji Danjuma";
  const leadPhone = appointment?.leadPhone || "+234 803 999 8877";
  const brokerName = appointment?.assignedBrokerName || "Ade Admin";
  const gatePass = appointment?.gatePassCode || "BI-9942-VIP";
  const meetingUrl = appointment?.meetingUrl || "https://meet.google.com/spacia-vip-inspection";

  const handleSendReminder = async () => {
    if (!appointment) return;
    setIsSending(true);
    try {
      const res = await appointmentsService.sendViewingReminder(appointment.id, reminderWindow);
      toast.success(res.message || `Viewing reminder (${reminderWindow}) dispatched via Resend.`);
    } catch {
      toast.error("Failed to send reminder notification.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyHtml = () => {
    toast.success("Notification template copied to clipboard.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border border-stone-200 bg-stone-50 shadow-2xl">
        <DialogHeader className="border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0d4a36] text-white">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-stone-900">
                  Resend Email Notification Previews
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Day 19 multi-party automated delivery engine &amp; viewings lifecycle
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800 font-mono">
              Resend Verified
            </Badge>
          </div>
        </DialogHeader>

        {/* Tab Controls */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
          <div className="border-b border-stone-200 bg-stone-100/80 px-5 pt-2">
            <TabsList className="bg-transparent gap-1 p-0 h-auto">
              <TabsTrigger
                value="prospect_conf"
                className="rounded-t-md rounded-b-none border-t border-x border-transparent px-3 py-1.5 text-xs font-medium text-stone-600 data-[state=active]:border-stone-200 data-[state=active]:bg-white data-[state=active]:text-[#0d4a36] data-[state=active]:shadow-none cursor-pointer"
              >
                1. Prospect Confirmation
              </TabsTrigger>
              <TabsTrigger
                value="prospect_remind"
                className="rounded-t-md rounded-b-none border-t border-x border-transparent px-3 py-1.5 text-xs font-medium text-stone-600 data-[state=active]:border-stone-200 data-[state=active]:bg-white data-[state=active]:text-[#0d4a36] data-[state=active]:shadow-none cursor-pointer"
              >
                2. Viewing Reminder
              </TabsTrigger>
              <TabsTrigger
                value="company_alert"
                className="rounded-t-md rounded-b-none border-t border-x border-transparent px-3 py-1.5 text-xs font-medium text-stone-600 data-[state=active]:border-stone-200 data-[state=active]:bg-white data-[state=active]:text-[#0d4a36] data-[state=active]:shadow-none cursor-pointer"
              >
                3. Company / Brokerage Alert
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-5">
            {/* 1. PROSPECT BOOKING CONFIRMATION */}
            <TabsContent value="prospect_conf" className="m-0 space-y-4">
              <div className="rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-2xs space-y-1 font-mono">
                <div className="flex items-center justify-between text-stone-500">
                  <span>To: <strong className="text-stone-800">{leadName}</strong> &lt;prospect@luxury.io&gt;</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-800 bg-emerald-50">PROSPECT</Badge>
                </div>
                <div className="text-stone-800 font-sans font-semibold">
                  Subject: Confirmed: Private Viewing of {propertyTitle} (#{refCode})
                </div>
              </div>

              {/* Rendered Luxury Email Body */}
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="bg-[#0d4a36] p-5 text-white">
                  <div className="text-lg font-bold tracking-tight">SPACIA</div>
                  <div className="mt-1 inline-block rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium text-emerald-100">
                    Private Wealth &amp; Luxury Real Estate
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs text-stone-700">
                  <div>
                    <h3 className="text-base font-bold text-[#0d4a36]">Viewing Confirmed</h3>
                    <p className="mt-1 text-stone-600 text-xs">
                      Dear {leadName}, your private appointment to inspect <strong>{propertyTitle}</strong> has been secured.
                    </p>
                  </div>

                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Appointment Specifications
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[11px]">Booking Reference</span>
                        <span className="font-mono font-bold text-[#0d4a36]">#{refCode}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Date</span>
                        <span className="font-semibold text-stone-900">{formattedDate}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Inspection Time</span>
                        <span className="font-semibold text-stone-900">{formattedTime}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Access Clearance Code</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px] inline-block">
                          {gatePass}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-stone-400 block text-[11px]">Location</span>
                        <span className="text-stone-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                          {propertyLocation}
                        </span>
                      </div>
                    </dl>
                  </div>

                  {meetingUrl && (
                    <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-stone-900">Google Meet Bridge</span>
                        <span className="text-[11px] text-stone-500 block font-mono">{meetingUrl}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-white border-stone-200 text-[#0d4a36]"
                        onClick={() => window.open(meetingUrl, "_blank")}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Join
                      </Button>
                    </div>
                  )}

                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Assigned Luxury Closer
                    </div>
                    <div className="font-semibold text-stone-900">{brokerName}</div>
                    <div className="text-stone-500 text-[11px]">Senior Luxury Real Estate Advisor • Spacia Advisory Group</div>
                    <div className="text-[#0d4a36] font-mono text-[11px] pt-0.5">Direct: +234 800 772 2420</div>
                  </div>
                </div>

                <div className="border-t border-stone-100 bg-stone-50 px-5 py-3 text-center text-[10px] text-stone-400">
                  Spacia Sales Command Center • Automated Luxury Concierge
                </div>
              </div>
            </TabsContent>

            {/* 2. PROSPECT VIEWING REMINDER */}
            <TabsContent value="prospect_remind" className="m-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-700">Reminder Timing:</span>
                  <div className="flex rounded-md border border-stone-200 bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setReminderWindow("24h")}
                      className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                        reminderWindow === "24h"
                          ? "bg-[#0d4a36] text-white font-medium"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      24h Prior
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderWindow("1h")}
                      className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                        reminderWindow === "1h"
                          ? "bg-rose-600 text-white font-medium"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      1h Urgent
                    </button>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleSendReminder}
                  disabled={isSending || !appointment}
                  className="h-8 gap-1.5 bg-[#0d4a36] text-xs text-white hover:bg-[#0a3829]"
                >
                  <Send className="h-3 w-3" />
                  <span>{isSending ? "Sending..." : `Dispatch ${reminderWindow} Via Resend`}</span>
                </Button>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-2xs space-y-1 font-mono">
                <div className="flex items-center justify-between text-stone-500">
                  <span>To: <strong className="text-stone-800">{leadName}</strong> &lt;prospect@luxury.io&gt;</span>
                  <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50">LIFECYCLE REMINDER</Badge>
                </div>
                <div className="text-stone-800 font-sans font-semibold">
                  Subject: Reminder: Your Property Inspection {reminderWindow === "1h" ? "in 1 Hour" : "Tomorrow"} at {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} (#{refCode})
                </div>
              </div>

              {/* Rendered Reminder Email */}
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="bg-[#0d4a36] p-5 text-white">
                  <div className="text-lg font-bold tracking-tight">SPACIA</div>
                  <div className="mt-1 inline-block rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium text-emerald-100">
                    Inspection Concierge
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs text-stone-700">
                  <div>
                    <h3 className="text-base font-bold text-[#0d4a36]">Upcoming Inspection Reminder</h3>
                    <p className="mt-1 text-stone-600 text-xs">
                      Dear {leadName}, this is a cordial reminder for your scheduled walkthrough of <strong>{propertyTitle}</strong> {reminderWindow === "1h" ? "in 1 hour" : "tomorrow"} at <strong>{start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</strong>.
                    </p>
                  </div>

                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Viewing Briefing &amp; Access Details
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <p><strong>Address:</strong> {propertyLocation}</p>
                      <p>
                        <strong>Gate Clearance Pass:</strong>{" "}
                        <span className="font-mono font-bold text-[#0d4a36] bg-emerald-100/70 px-1.5 py-0.5 rounded">
                          {gatePass}
                        </span>{" "}
                        (Show at estate entrance)
                      </p>
                      <p><strong>Advisor on-site:</strong> {brokerName}</p>
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <Button
                      type="button"
                      className="bg-[#0d4a36] text-white hover:bg-[#0a3829] text-xs px-6 h-9 font-medium"
                      onClick={() => toast.success("Attendance confirmed for prospect!")}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      I Will Be Attending
                    </Button>
                    <p className="text-[10px] text-stone-400 mt-2">
                      Need to reschedule? Reply directly to this email or contact your assigned advisor.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 3. COMPANY / BROKERAGE ALERT WITH LEAD CONTEXT, PROPERTY CONTEXT & AI SUMMARY */}
            <TabsContent value="company_alert" className="m-0 space-y-4">
              <div className="rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-2xs space-y-1 font-mono">
                <div className="flex items-center justify-between text-stone-500">
                  <span>To: <strong className="text-stone-800">Spacia Closers Group</strong> &lt;closers@spacia.io&gt;</span>
                  <Badge className="bg-[#0d4a36] text-white text-[10px]">BROKERAGE ALERT</Badge>
                </div>
                <div className="text-stone-800 font-sans font-semibold">
                  Subject: [New Viewing Booked] {leadName} (HOT 94/100) — {propertyTitle}
                </div>
              </div>

              {/* Rendered Company Alert Body */}
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="bg-[#0d4a36] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold tracking-tight">SPACIA COMMAND</div>
                      <div className="text-[11px] text-emerald-200">High-Stakes Deal Underwriting Briefing</div>
                    </div>
                    <Badge className="bg-rose-500/90 text-white font-mono text-xs">
                      HOT 94/100
                    </Badge>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs text-stone-700">
                  {/* 1. LEAD CONTEXT */}
                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        1. Lead Context (BANT Qualification)
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Budget Verified
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[11px]">Prospect Name</span>
                        <span className="font-semibold text-stone-900">{leadName}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Direct Mobile</span>
                        <span className="font-mono text-stone-800">{leadPhone}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Liquid Budget</span>
                        <span className="font-semibold text-[#0d4a36]">₦1,200,000,000 (Liquid)</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Timeline</span>
                        <span className="font-medium text-stone-800">Within 14 days</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-stone-400 block text-[11px]">Decision Authority &amp; Catalyst</span>
                        <span className="text-stone-800 italic">
                          "Sole principal buyer; offshore funds repatriated through approved CBN window for immediate waterfront asset."
                        </span>
                      </div>
                    </dl>
                  </div>

                  {/* 2. PROPERTY CONTEXT */}
                  <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3.5 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      2. Property Context &amp; Commission
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[11px]">Listing Title</span>
                        <span className="font-semibold text-stone-900">{propertyTitle}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Asking Price</span>
                        <span className="font-semibold text-[#0d4a36] font-mono">{propertyPrice}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Location</span>
                        <span className="text-stone-800">{propertyLocation}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Projected Agency Commission</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px] inline-block">
                          ₦47,500,000 (5% LASRERA)
                        </span>
                      </div>
                    </dl>
                  </div>

                  {/* 3. AI UNDERWRITING & CALL SYNTHESIS */}
                  <div className="rounded-lg border-l-4 border-l-[#0d4a36] border border-stone-200 bg-stone-50/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d4a36] flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        3. AI Call Synthesis &amp; Sentiment
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">
                        BULLISH SENTIMENT
                      </Badge>
                    </div>
                    <p className="text-stone-700 leading-relaxed text-xs">
                      AI voice agent completed a 4-minute qualification call. Buyer is eager to close before end of Q4. Inquired specifically regarding Governor's Consent and private jetty docking rights.
                    </p>
                    <div className="space-y-1 pt-1">
                      <div className="text-[11px] font-medium text-stone-700">Resolved Objections:</div>
                      <ul className="list-disc pl-4 text-[11px] text-stone-600 space-y-0.5">
                        <li>Confirmed Governor's Consent is fully perfected in land registry.</li>
                        <li>Verified dedicated transformer and 24/7 dual Perkins generators.</li>
                      </ul>
                    </div>
                    <div className="rounded bg-amber-50/80 border border-amber-200/70 p-2 text-[11px] text-amber-900 mt-2">
                      <strong>Recommended Closing Strategy:</strong> Present original survey plan at start of inspection. Lead is prepared to submit 10% commitment deposit upon physical verification.
                    </div>
                  </div>

                  {/* 4. SCHEDULE SUMMARY */}
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-emerald-950">
                        Viewing Scheduled: {formattedDate}
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Host Closer: {brokerName} · Time: {formattedTime}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-white text-[10px]">
                      CONFIRMED
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-stone-200 bg-white px-5 py-3 flex items-center justify-between sm:justify-between">
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0d4a36]" />
            <span>Multi-tenant isolated &amp; Neon DB logged</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyHtml}
              className="h-8 gap-1 border-stone-200 bg-white text-xs text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              <Copy className="h-3 w-3" />
              <span>Copy Preview</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 bg-[#0d4a36] text-xs font-medium text-white hover:bg-[#0a3829] cursor-pointer"
            >
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
