"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Appointment,
  appointmentsService,
  AppointmentCard,
  AppointmentFiltersBar,
  BookInspectionModal,
  CalendarConnectionsPanel,
} from "@/features/appointments";
import { useWorkspace } from "@/lib/context/workspace-context";
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Sparkles,
  CalendarCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function AppointmentsPage() {
  const { currentWorkspace } = useWorkspace();

  const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [formatFilter, setFormatFilter] = React.useState<string>("ALL");
  const [activeTab, setActiveTab] = React.useState("schedule");

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);

  const fetchAppointments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await appointmentsService.getAppointments();
      setAllAppointments(data);
    } catch (err: any) {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Auto-switch to connected calendars tab if OAuth parameters are detected in URL
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("code") || params.get("calendar") || params.get("tab") === "calendars") {
        setActiveTab("calendars");
      }
    }
  }, []);

  const handleStatusChange = async (id: string, newStatus: any) => {
    const updated = await appointmentsService.updateStatus(id, newStatus);
    setAllAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  // Filtered Appointments
  const filteredAppointments = React.useMemo(() => {
    return allAppointments.filter((apt) => {
      // Status filter
      if (statusFilter !== "ALL" && apt.status !== statusFilter) {
        return false;
      }
      // Format filter
      if (formatFilter !== "ALL" && apt.meetingType !== formatFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesName = apt.leadName.toLowerCase().includes(query);
        const matchesPhone = apt.leadPhone.toLowerCase().includes(query);
        const matchesProperty = apt.propertyTitle.toLowerCase().includes(query);
        const matchesLocation = apt.location.toLowerCase().includes(query);
        const matchesBroker = apt.assignedBrokerName.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesProperty && !matchesLocation && !matchesBroker) {
          return false;
        }
      }
      return true;
    });
  }, [allAppointments, statusFilter, formatFilter, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setFormatFilter("ALL");
  };

  const confirmedCount = allAppointments.filter((a) => a.status === "confirmed").length;
  const scheduledCount = allAppointments.filter((a) => a.status === "scheduled").length;
  const completedCount = allAppointments.filter((a) => a.status === "completed").length;

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
            {allAppointments.length}
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
            Inspection Schedule ({allAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="calendars" className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#0d4a36] data-[state=active]:shadow-2xs cursor-pointer">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Connected Calendars
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Inspection Schedule */}
        <TabsContent value="schedule" className="space-y-4 outline-none">
          {/* Design System Search & Filter Bar */}
          <AppointmentFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            formatFilter={formatFilter}
            onFormatChange={setFormatFilter}
            onReset={handleResetFilters}
            totalCount={allAppointments.length}
            filteredCount={filteredAppointments.length}
          />

          {/* Appointments Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-40 rounded-xl border border-stone-200 bg-stone-50/50 animate-pulse" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-stone-300">
              <CalendarDays className="h-10 w-10 text-stone-300 mx-auto" />
              <h4 className="mt-3 text-sm font-semibold text-stone-800">No Viewings Found</h4>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                No property inspections match the selected filters. Schedule a new viewing or adjust your search.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {(searchQuery || statusFilter !== "ALL" || formatFilter !== "ALL") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetFilters}
                    className="text-xs h-8 cursor-pointer"
                  >
                    Reset Filters
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setIsBookModalOpen(true)}
                  className="bg-[#0d4a36] text-white text-xs h-8 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Schedule Inspection
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredAppointments.map((apt) => (
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
