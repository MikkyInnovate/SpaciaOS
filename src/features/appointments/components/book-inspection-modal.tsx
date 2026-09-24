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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appointmentsService } from "../services/appointments-service";
import { ViewingSlot, CreateAppointmentPayload } from "../types";
import {
  CalendarDays,
  Clock,
  MapPin,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
  Key,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface BookInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  propertyId?: string;
  propertyTitle?: string;
  onBookingSuccess?: (appointment: any) => void;
}

export function BookInspectionModal({
  open,
  onOpenChange,
  leadId = "lead_default",
  leadName = "VIP Prospect",
  leadPhone = "+234 800 000 0000",
  propertyId = "prop_banana_villa",
  propertyTitle = "The Grand Waterfront Villa — Banana Island",
  onBookingSuccess,
}: BookInspectionModalProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });

  const [availableSlots, setAvailableSlots] = React.useState<ViewingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = React.useState<string>("");
  const [meetingType, setMeetingType] = React.useState<string>("in_person_viewing");
  const [assignedBroker, setAssignedBroker] = React.useState<string>("broker_ade");
  const [location, setLocation] = React.useState<string>("Zone A Private Gate, Banana Island, Ikoyi");
  const [generateGatePass, setGenerateGatePass] = React.useState<boolean>(true);
  const [notes, setNotes] = React.useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch slots on date change
  React.useEffect(() => {
    if (!open) return;
    setIsLoadingSlots(true);
    const dateObj = new Date(selectedDate);
    appointmentsService
      .getAvailableSlots(propertyId, dateObj)
      .then((slots) => {
        setAvailableSlots(slots);
        const firstAvailable = slots.find((s) => s.isAvailable);
        if (firstAvailable) {
          setSelectedSlotId(firstAvailable.id);
        }
      })
      .finally(() => setIsLoadingSlots(false));
  }, [open, selectedDate, propertyId]);

  const handleBook = async () => {
    const chosenSlot = availableSlots.find((s) => s.id === selectedSlotId);
    if (!chosenSlot) {
      toast.error("Please select an available viewing time slot.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateAppointmentPayload = {
        leadId,
        propertyId,
        assignedBrokerId: assignedBroker,
        startTime: chosenSlot.startTime,
        endTime: chosenSlot.endTime,
        meetingType: meetingType as any,
        location,
        notes,
        generateGatePass,
      };

      const newApt = await appointmentsService.createAppointment(payload);
      toast.success(`Inspection scheduled successfully for ${new Date(chosenSlot.startTime).toLocaleDateString()}!`);
      onBookingSuccess?.(newApt);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-stone-200 bg-[#fbfbf9] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0d4a36] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Inspection Scheduling
            </span>
          </div>
          <DialogTitle className="mt-1 text-xl font-bold text-white">
            Schedule Property Viewing
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald-100/80">
            Book an in-person viewing with real-time broker clash detection and gate clearance.
          </DialogDescription>
        </div>

        {/* Form Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
          {/* Prospect & Property Context */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="text-[11px] font-medium text-stone-400 uppercase">Prospect</div>
              <div className="font-semibold text-stone-900">{leadName}</div>
              <div className="text-xs text-stone-500">{leadPhone}</div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="text-[11px] font-medium text-stone-400 uppercase">Target Listing</div>
              <div className="truncate font-semibold text-stone-900">{propertyTitle}</div>
              <div className="text-xs text-emerald-800 font-medium">Verified Property</div>
            </div>
          </div>

          {/* Date & Slot Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                1. Select Inspection Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-44 h-8 text-xs bg-white border-stone-300 font-medium"
              />
            </div>

            {/* Slots Grid */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-stone-500">Available Time Slots</div>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center p-6 text-xs text-stone-400">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking broker availability across calendar...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={cn(
                        "flex flex-col items-start p-2.5 rounded-lg border text-left transition-all text-xs",
                        !slot.isAvailable
                          ? "border-stone-200 bg-stone-100/60 text-stone-400 cursor-not-allowed opacity-60"
                          : selectedSlotId === slot.id
                          ? "border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-700/20 shadow-sm"
                          : "border-stone-200 bg-white hover:border-emerald-600 hover:bg-stone-50 text-stone-800"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{slot.formattedTime.split("–")[0]}</span>
                        {selectedSlotId === slot.id && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 mt-0.5">
                        {slot.isAvailable ? "Available" : "Booked"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Meeting Configuration */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Meeting Format</label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger className="bg-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person_viewing">In-Person Property Viewing</SelectItem>
                  <SelectItem value="vip_private_showing">VIP Private Showing</SelectItem>
                  <SelectItem value="virtual_tour">Live Video Tour</SelectItem>
                  <SelectItem value="office_consultation">Brokerage Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Assigned Host Broker</label>
              <Select value={assignedBroker} onValueChange={setAssignedBroker}>
                <SelectTrigger className="bg-white text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broker_ade">Ade Admin (Senior Luxury Closer)</SelectItem>
                  <SelectItem value="broker_victoria">Victoria Okon (Senior Partner)</SelectItem>
                  <SelectItem value="broker_femi">Femi Davies (Ikoyi Specialist)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location & Gate Pass Toggle */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Viewing Location / Meeting Point</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Zone A Security Gate, Banana Island"
                className="bg-white text-xs h-9"
              />
            </div>

            {/* Gate Pass Switch */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-200/60 bg-emerald-50/50 p-3">
              <div className="flex items-start gap-2.5">
                <Key className="h-4 w-4 text-emerald-700 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-emerald-950">
                    Generate VIP Security Gate Pass
                  </div>
                  <div className="text-[11px] text-emerald-800/80">
                    Auto-generates estate gate clearance token & QR pass for prospect.
                  </div>
                </div>
              </div>
              <Switch
                checked={generateGatePass}
                onCheckedChange={setGenerateGatePass}
              />
            </div>

            {/* Special Directives / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Internal Broker Directives</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special notes (e.g. VIP client, prepare survey deed and payment plan schedules)"
                className="bg-white text-xs min-h-[60px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleBook}
            disabled={isSubmitting || !selectedSlotId}
            className="bg-[#0d4a36] text-white hover:bg-[#0d4a36]/90 text-xs font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Confirming Slot...
              </>
            ) : (
              <>
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                Schedule Inspection
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
