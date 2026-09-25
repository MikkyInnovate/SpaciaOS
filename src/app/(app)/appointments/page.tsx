"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Appointment,
  appointmentsService,
  AppointmentCard,
  BookInspectionModal,
  CalendarConnectionsPanel,
} from "@/features/appointments";
import { useWorkspace } from "@/lib/context/workspace-context";
import {
  CalendarDays,
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  CalendarCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

export default function AppointmentsPage() {
  const { currentWorkspace } = useWorkspace();

  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [activeTab, setActiveTab] = React.useState("schedule");

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);

  const fetchAppointments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await appointmentsService.getAppointments({
        status: statusFilter,
        search: searchQuery,
      });
      setAppointments(data);
    } catch (err: any) {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = async (id: string, newStatus: any) => {
    const updated = await appointmentsService.updateStatus(id, newStatus);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  return (
    <Container size="lg" className="space-y-6 pb-12">
      <PageHeader
        title="Appointments & Inspections"
        description={`Manage confirmed luxury property viewings, agent schedules, and calendar availability for ${currentWorkspace?.name || "your workspace"}.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAppointments}
              className="h-8.5 gap-1.5 text-xs text-stone-700 bg-white border-stone-200 hover:bg-stone-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-stone-500" />
              <span>Refresh</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsBookModalOpen(true)}
              className="h-8.5 gap-1.5 bg-[#0d4a36] text-white hover:bg-[#0a3829] text-xs shadow-2xs font-medium cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Inspection</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Total Bookings</span>
            <CalendarDays className="h-4 w-4 text-stone-400" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-stone-900">
            {appointments.length}
          </div>
          <div className="mt-1 text-[11px] text-stone-400">All recorded inspections</div>
        </Card>

        <Card className="border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Confirmed Viewings</span>
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-800">
            {confirmedCount}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">Ready for walkthrough</div>
        </Card>

        <Card className="border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Pending Confirmation</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-amber-700">
            {scheduledCount}
          </div>
          <div className="mt-1 text-[11px] text-stone-400">Awaiting client confirm</div>
        </Card>

        <Card className="border border-stone-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Completed Viewings</span>
            <CheckCircle2 className="h-4 w-4 text-[#0d4a36]" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#0d4a36]">
            {completedCount}
          </div>
          <div className="mt-1 text-[11px] text-stone-400">Successfully conducted</div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-stone-100 p-1 border border-stone-200/80">
          <TabsTrigger value="schedule" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#0d4a36] data-[state=active]:shadow-2xs cursor-pointer">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            Inspection Schedule ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="calendars" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#0d4a36] data-[state=active]:shadow-2xs cursor-pointer">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Connected Calendars
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Inspection Schedule */}
        <TabsContent value="schedule" className="space-y-4 outline-none">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
              <Search className="h-4 w-4 text-stone-400 shrink-0" />
              <Input
                placeholder="Search by prospect, property, location, or broker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 shadow-none px-0"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {(["ALL", "confirmed", "scheduled", "completed", "cancelled"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium capitalize transition cursor-pointer",
                    statusFilter === st
                      ? "bg-[#0d4a36] text-white shadow-2xs"
                      : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                  )}
                >
                  {st === "ALL" ? "All Statuses" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-64 rounded-xl border border-stone-200 bg-stone-50/50 animate-pulse" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-stone-300">
              <CalendarDays className="h-10 w-10 text-stone-300 mx-auto" />
              <h4 className="mt-3 text-sm font-semibold text-stone-800">No Viewings Found</h4>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                No property inspections match the selected filters. Schedule a new viewing or adjust your search.
              </p>
              <Button
                size="sm"
                onClick={() => setIsBookModalOpen(true)}
                className="mt-4 bg-[#0d4a36] text-white text-xs h-8 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Schedule Inspection
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Calendar Connections */}
        <TabsContent value="calendars" className="outline-none">
          <CalendarConnectionsPanel />
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      <BookInspectionModal
        open={isBookModalOpen}
        onOpenChange={setIsBookModalOpen}
        onBookingSuccess={() => fetchAppointments()}
      />
    </Container>
  );
}
