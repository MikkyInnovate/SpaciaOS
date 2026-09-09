"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { UpcomingViewingsList } from "@/features/dashboard/components/upcoming-viewings-list";
import { MOCK_UPCOMING_VIEWINGS } from "@/features/dashboard/data/mock-data";
import type { DashboardViewing } from "@/features/dashboard/types";
import { useWorkspace } from "@/lib/context/workspace-context";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  CalendarDays,
  CalendarCheck,
  Plus,
  ExternalLink,
  Check,
  Sparkles,
  ShieldCheck,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

const ACTIVE_PROSPECTS = [
  { name: "Michael Adeleke", score: 92, category: "HOT", property: "3-Bed Contemporary Flat — Lekki" },
  { name: "Sarah Jenkins", score: 88, category: "WARM", property: "Waterfront Penthouse — Ikoyi" },
  { name: "Chief Raymond Cole", score: 95, category: "HOT", property: "5-Bed Smart Villa — Eko Atlantic" },
  { name: "Fatima Al-Hassan", score: 77, category: "WARM", property: "4-Bed Terrace — Chevron Drive" },
  { name: "Chinedu Ekwueme", score: 95, category: "HOT", property: "Smart Luxury Penthouse — Eko Atlantic" },
];

const AVAILABLE_PROPERTIES = [
  "3-Bed Contemporary Flat — Lekki",
  "Waterfront Penthouse — Ikoyi",
  "5-Bed Smart Villa — Eko Atlantic",
  "4-Bed Terrace Townhouse — Chevron Drive",
  "Luxury Maisonette — Victoria Island",
];

const BROKERS = [
  { name: "Marcus Vance", pod: "Lekki Pod", todayCount: 3 },
  { name: "Chioma Okafor", pod: "Ikoyi Luxury Director", todayCount: 2 },
  { name: "Amina Bello", pod: "Victoria Island Pod", todayCount: 1 },
];

export default function AppointmentsPage() {
  const { currentWorkspace } = useWorkspace();
  const [viewings, setViewings] = React.useState<DashboardViewing[]>(MOCK_UPCOMING_VIEWINGS);

  // Flow 1: Connect Calendar Drawer State
  const [isCalendarDrawerOpen, setIsCalendarDrawerOpen] = React.useState(false);
  const [calendarProvider, setCalendarProvider] = React.useState<"google" | "outlook">("google");
  const [bufferMinutes, setBufferMinutes] = React.useState("30");
  const [viewingDuration, setViewingDuration] = React.useState("45");
  const [isCalendarConnecting, setIsCalendarConnecting] = React.useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = React.useState(true);

  // Flow 2: Schedule Inspection Drawer State
  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = React.useState(false);
  const [selectedProspect, setSelectedProspect] = React.useState(ACTIVE_PROSPECTS[0].name);
  const [customProspectName, setCustomProspectName] = React.useState("");
  const [selectedProperty, setSelectedProperty] = React.useState(AVAILABLE_PROPERTIES[0]);
  const [selectedBroker, setSelectedBroker] = React.useState(BROKERS[0].name);
  const [selectedDate, setSelectedDate] = React.useState("Today, Sep 9");
  const [selectedTime, setSelectedTime] = React.useState("2:30 PM");
  const [viewingType, setViewingType] = React.useState<"in_person" | "video">("in_person");
  const [notes, setNotes] = React.useState("");
  const [isScheduling, setIsScheduling] = React.useState(false);

  // Handle Calendar Connection flow
  const handleConnectCalendar = () => {
    setIsCalendarConnecting(true);
    setTimeout(() => {
      setIsCalendarConnecting(false);
      setIsCalendarConnected(true);
      setIsCalendarDrawerOpen(false);
      toast.success(
        calendarProvider === "google"
          ? "Google Calendar synchronized!"
          : "Microsoft 365 Outlook synchronized!",
        {
          description: `Autonomous inspection scheduler active with ${bufferMinutes}-minute buffer between viewings.`,
        }
      );
    }, 700);
  };

  // Handle Schedule Inspection flow
  const handleScheduleInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const prospectName = customProspectName.trim() || selectedProspect;
    if (!prospectName) {
      toast.error("Please provide a prospect name.");
      return;
    }

    setIsScheduling(true);

    setTimeout(() => {
      const newViewing: DashboardViewing = {
        id: `view_${Date.now()}`,
        prospectName,
        propertyTitle: selectedProperty,
        agentName: selectedBroker,
        date: selectedDate,
        time: selectedTime,
        status: "Confirmed",
        leadScore: 90,
      };

      setViewings((prev) => [newViewing, ...prev]);
      setIsScheduling(false);
      setIsScheduleDrawerOpen(false);
      setCustomProspectName("");
      setNotes("");

      toast.success("Inspection Scheduled & Dispatched!", {
        description: `Confirmed for ${prospectName} at ${selectedProperty}. Dispatched to ${selectedBroker}'s calendar.`,
      });
    }, 600);
  };

  return (
    <Container size="lg" className="space-y-4">
      <PageHeader
        title="Appointments"
        description={`Confirmed viewings and scheduled property inspections for ${currentWorkspace.name}.`}
        actions={
          <div className="flex items-center gap-2">
            {/* Flow 1: Calendar Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCalendarDrawerOpen(true)}
              className="h-8.5 gap-1.5 text-xs text-stone-700 bg-white border-stone-200 hover:bg-stone-50 cursor-pointer shadow-2xs"
            >
              {isCalendarConnected ? (
                <>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-stone-800">
                    {calendarProvider === "google" ? "Google Calendar" : "Outlook Calendar"} Synced
                  </span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
                  <span>Connect Google/Outlook Calendar</span>
                </>
              )}
            </Button>

            {/* Flow 2: Schedule Inspection Button */}
            <Button
              size="sm"
              onClick={() => setIsScheduleDrawerOpen(true)}
              className="h-8.5 gap-1.5 bg-[#0d4a36] text-white hover:bg-[#0a3829] text-xs cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Inspection</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border shadow-2xs">
          <CardHeader className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-stone-900">
                  Upcoming Inspection Schedule
                </CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Confirmed property walkthroughs scheduled by Spacia autonomous agent and brokers.
                </CardDescription>
              </div>
              {/* Image 3: Removed pill corner radius */}
              <span className="text-xs font-medium text-stone-500 tabular-nums">
                {viewings.length} confirmed bookings
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <UpcomingViewingsList viewings={viewings} />
          </CardContent>
        </Card>

        {/* Viewing Dispatch Summary */}
        <Card className="space-y-4 p-4 border-border shadow-2xs">
          <div>
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider text-stone-500">
              Assigned Real-Estate Brokers
            </h4>
            <div className="mt-3 space-y-2.5 text-xs">
              {BROKERS.map((broker) => (
                <div
                  key={broker.name}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-100"
                >
                  <div>
                    <p className="font-semibold text-stone-800">{broker.name}</p>
                    <p className="text-[11px] text-stone-400">{broker.pod}</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
                    {broker.todayCount} viewings today
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-3 text-xs space-y-1.5">
            <div className="font-semibold text-stone-800 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#0d4a36]" />
              <span>Autonomous Inspection Reminders</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Prospects automatically receive GPS directions, gated community gate-pass codes, and broker direct lines 2 hours prior to physical walkthrough.
            </p>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* FLOW 1 DRAWER: CONNECT GOOGLE / OUTLOOK CALENDAR */}
      {/* ========================================================================= */}
      <Drawer open={isCalendarDrawerOpen} onOpenChange={setIsCalendarDrawerOpen}>
        <DrawerContent className="max-w-lg mx-auto">
          <div className="mx-auto w-full max-w-lg p-5 pt-2">
            <DrawerHeader className="px-0 pt-0 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d4a36] text-white">
                    <CalendarDays className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div>
                    <DrawerTitle>Calendar Synchronization</DrawerTitle>
                    <DrawerDescription>
                      Sync broker availability for autonomous bookings with zero schedule conflicts.
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

            <div className="space-y-4 py-2 text-xs">
              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="font-semibold text-stone-700">Select Calendar Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCalendarProvider("google")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      calendarProvider === "google"
                        ? "border-[#0d4a36] bg-emerald-50/40 ring-1 ring-[#0d4a36]"
                        : "border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-stone-900 text-xs">Google Calendar</span>
                      {calendarProvider === "google" && (
                        <Check className="h-3.5 w-3.5 text-[#0d4a36]" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500">Workspace &amp; Gmail calendars</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalendarProvider("outlook")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer",
                      calendarProvider === "outlook"
                        ? "border-[#0d4a36] bg-emerald-50/40 ring-1 ring-[#0d4a36]"
                        : "border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-stone-900 text-xs">Microsoft Outlook</span>
                      {calendarProvider === "outlook" && (
                        <Check className="h-3.5 w-3.5 text-[#0d4a36]" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500">Office 365 &amp; Exchange</p>
                  </button>
                </div>
              </div>

              {/* Travel Buffer Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-700">Travel Buffer Between Viewings</label>
                  <span className="text-[11px] text-stone-400">Account for traffic</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {["15", "30", "45", "60"].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setBufferMinutes(mins)}
                      className={cn(
                        "py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        bufferMinutes === mins
                          ? "border-[#0d4a36] bg-[#0d4a36] text-white font-semibold"
                          : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Viewing Duration */}
              <div className="space-y-2">
                <label className="font-semibold text-stone-700">Default Viewing Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {["30", "45", "60"].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setViewingDuration(mins)}
                      className={cn(
                        "py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        viewingDuration === mins
                          ? "border-[#0d4a36] bg-[#0d4a36] text-white font-semibold"
                          : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Summary */}
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-stone-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Working hours: 9:00 AM – 6:00 PM (WAT)</span>
                </div>
                <span className="font-semibold text-emerald-700">Auto-Enforced</span>
              </div>
            </div>

            <DrawerFooter className="px-0 pb-0 pt-3 flex flex-row items-center justify-end gap-2 border-t border-stone-100">
              <DrawerClose asChild>
                <Button variant="outline" size="sm" className="text-xs h-8.5 cursor-pointer">
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                size="sm"
                onClick={handleConnectCalendar}
                disabled={isCalendarConnecting}
                className="gap-1.5 bg-[#0d4a36] text-white hover:bg-[#0a3829] text-xs h-8.5 cursor-pointer"
              >
                {isCalendarConnecting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Authorize &amp; Sync</span>
                  </>
                )}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ========================================================================= */}
      {/* FLOW 2 DRAWER: SCHEDULE INSPECTION */}
      {/* ========================================================================= */}
      <Drawer open={isScheduleDrawerOpen} onOpenChange={setIsScheduleDrawerOpen}>
        <DrawerContent className="max-w-lg mx-auto">
          <div className="mx-auto w-full max-w-lg p-5 pt-2">
            <DrawerHeader className="px-0 pt-0 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d4a36] text-white">
                    <CalendarCheck className="h-4 w-4 text-emerald-200" />
                  </div>
                  <div>
                    <DrawerTitle>Schedule Property Inspection</DrawerTitle>
                    <DrawerDescription>
                      Confirm viewing slot, assign broker, and dispatch calendar invitations.
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

            <form onSubmit={handleScheduleInspection} className="space-y-3.5 py-1 text-xs">
              {/* Prospect Selection (Using Design System Select) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Prospect / Buyer Lead *</label>
                <Select value={selectedProspect} onValueChange={setSelectedProspect}>
                  <SelectTrigger className="h-9 text-xs bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Select prospect" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVE_PROSPECTS.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name} — Score: {p.score} ({p.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or enter new walk-in / prospect name..."
                  value={customProspectName}
                  onChange={(e) => setCustomProspectName(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>

              {/* Property Selection (Using Design System Select) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Target Property *</label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger className="h-9 text-xs bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_PROPERTIES.map((prop) => (
                      <SelectItem key={prop} value={prop}>
                        {prop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Broker (Using Design System Select) */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Assigned Broker *</label>
                <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                  <SelectTrigger className="h-9 text-xs bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    {BROKERS.map((b) => (
                      <SelectItem key={b.name} value={b.name}>
                        {b.name} ({b.pod} — {b.todayCount} viewings today)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Inspection Date</label>
                <div className="grid grid-cols-4 gap-2">
                  {["Today, Sep 9", "Tomorrow, Sep 10", "Thu, Sep 11", "Fri, Sep 12"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={cn(
                        "py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all cursor-pointer truncate",
                        selectedDate === d
                          ? "border-[#0d4a36] bg-[#0d4a36] text-white font-semibold"
                          : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {d.split(",")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Available Time Slot</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {["10:00 AM", "11:30 AM", "02:00 PM", "03:30 PM", "05:00 PM"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={cn(
                        "py-1.5 rounded-lg border text-[11px] font-medium transition-all cursor-pointer text-center",
                        selectedTime === t
                          ? "border-[#0d4a36] bg-emerald-50 text-[#0d4a36] font-bold border-emerald-400"
                          : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspection Type */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Viewing Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingType("in_person")}
                    className={cn(
                      "py-2 px-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between",
                      viewingType === "in_person"
                        ? "border-[#0d4a36] bg-emerald-50/40 font-semibold text-stone-900"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    <span>Private On-Site Inspection</span>
                    {viewingType === "in_person" && <Check className="h-3.5 w-3.5 text-[#0d4a36]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingType("video")}
                    className={cn(
                      "py-2 px-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between",
                      viewingType === "video"
                        ? "border-[#0d4a36] bg-emerald-50/40 font-semibold text-stone-900"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    <span>Live Video Walkthrough</span>
                    {viewingType === "video" && <Check className="h-3.5 w-3.5 text-[#0d4a36]" />}
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700">Access Notes (Optional)</label>
                <Input
                  placeholder="e.g. Gate pass required; buyer arriving with structural surveyor."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <DrawerFooter className="px-0 pb-0 pt-3 flex flex-row items-center justify-end gap-2 border-t border-stone-100">
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8.5 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </DrawerClose>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isScheduling}
                  className="gap-1.5 bg-[#0d4a36] text-white hover:bg-[#0a3829] text-xs h-8.5 cursor-pointer px-4"
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Dispatching Viewing...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-3.5 w-3.5" />
                      <span>Confirm &amp; Dispatch Viewing</span>
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
