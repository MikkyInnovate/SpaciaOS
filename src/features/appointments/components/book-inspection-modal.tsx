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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appointmentsService } from "../services/appointments-service";
import { ViewingSlot, CreateAppointmentPayload } from "../types";
import { AvailabilitySelector } from "./availability-selector";
import { MOCK_PROPERTIES } from "@/features/properties/data/mock-properties";
import { MOCK_LEADS } from "@/features/leads/data/mock-leads";
import {
  CalendarDays,
  Building2,
  User,
  CheckCircle2,
  Loader2,
  MapPin,
  Clock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface BookInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  leadEmail?: string;
  propertyId?: string;
  propertyTitle?: string;
  onBookingSuccess?: (appointment: any) => void;
}

export function BookInspectionModal({
  open,
  onOpenChange,
  leadId: initialLeadId,
  leadName: initialLeadName,
  leadPhone: initialLeadPhone,
  leadEmail: initialLeadEmail,
  propertyId: initialPropertyId,
  propertyTitle: initialPropertyTitle,
  onBookingSuccess,
}: BookInspectionModalProps) {
  // Selected Lead State
  const [selectedLeadId, setSelectedLeadId] = React.useState<string>(
    initialLeadId || MOCK_LEADS[0]?.id || "lead_01"
  );
  
  // Selected Property State
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string>(
    initialPropertyId || MOCK_PROPERTIES[0]?.id || "prop_lekki_01"
  );

  const activeLead = React.useMemo(() => {
    const found = MOCK_LEADS.find((l) => l.id === selectedLeadId);
    if (found) return found;
    return {
      id: selectedLeadId,
      name: initialLeadName || "Select Client",
      phone: initialLeadPhone || "",
      email: initialLeadEmail || "client@spacia.io",
    };
  }, [selectedLeadId, initialLeadName, initialLeadPhone, initialLeadEmail]);

  // Client Email State for real-time notification routing
  const [clientEmail, setClientEmail] = React.useState<string>(
    initialLeadEmail || activeLead.email || ""
  );

  React.useEffect(() => {
    if (activeLead?.email) {
      setClientEmail(activeLead.email);
    }
  }, [activeLead]);

  const activeProperty = React.useMemo(() => {
    return MOCK_PROPERTIES.find((p) => p.id === selectedPropertyId) || {
      id: selectedPropertyId,
      title: initialPropertyTitle || "Select Property",
      location: "Lagos, Nigeria",
      formattedPrice: "",
    };
  }, [selectedPropertyId, initialPropertyTitle]);

  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  });

  const [selectedSlot, setSelectedSlot] = React.useState<ViewingSlot | null>(null);
  const [meetingType, setMeetingType] = React.useState<string>("in_person_viewing");
  const [assignedBroker, setAssignedBroker] = React.useState<string>("broker_ade");
  const [location, setLocation] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync initial props
  React.useEffect(() => {
    if (initialLeadId) setSelectedLeadId(initialLeadId);
    if (initialPropertyId) setSelectedPropertyId(initialPropertyId);
  }, [initialLeadId, initialPropertyId, open]);

  // Update location when property changes
  React.useEffect(() => {
    if (activeProperty?.location) {
      setLocation(activeProperty.location);
    }
  }, [activeProperty]);

  const handleBook = async () => {
    if (!selectedSlot || !selectedSlot.isAvailable) {
      toast.error("Please select an available viewing time slot.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateAppointmentPayload = {
        leadId: activeLead.id,
        leadName: activeLead.name,
        leadPhone: activeLead.phone,
        leadEmail: clientEmail.trim() || (activeLead as any).email || undefined,
        propertyId: activeProperty.id,
        propertyTitle: activeProperty.title,
        assignedBrokerId: assignedBroker,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        meetingType: meetingType as any,
        location: location || activeProperty.location,
        notes,
      };

      const newApt = await appointmentsService.createAppointment(payload);
      toast.success("Booking Successful!", {
        description: `Property inspection scheduled with ${activeLead.name} for ${new Date(selectedSlot.startTime).toLocaleDateString()} (${selectedSlot.formattedTime || "Scheduled viewing"}).`,
        duration: 5000,
      });
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
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border border-stone-200 bg-white shadow-xl">
        {/* Standard Clean Header */}
        <DialogHeader className="p-5 pb-4 border-b border-stone-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-[#0d4a36]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-900">
                Schedule Property Inspection
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Select client, listing, and inspection time slot with real-time broker sync.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <div className="max-h-[68vh] overflow-y-auto p-6 space-y-4.5">
          {/* Client & Property Selectors */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Select Client / Lead */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#0d4a36]" />
                <span>Client / Prospect</span>
              </label>
              <Select
                value={selectedLeadId}
                onValueChange={(val) => {
                  setSelectedLeadId(val);
                  const matched = MOCK_LEADS.find((l) => l.id === val);
                  if (matched?.email) setClientEmail(matched.email);
                }}
              >
                <SelectTrigger className="bg-white text-xs min-h-[50px] h-auto py-2 px-3 border-stone-200 [&>span]:line-clamp-none [&>span]:flex-1 text-left">
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {MOCK_LEADS.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id} className="text-xs py-2 cursor-pointer">
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900">{lead.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">{lead.phone}</span>
                        </div>
                        <span className="text-[11px] text-[#0d4a36] font-medium mt-0.5">{lead.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Target Property */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#0d4a36]" />
                <span>Target Listing</span>
              </label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="bg-white text-xs min-h-[50px] h-auto py-2 px-3 border-stone-200 [&>span]:line-clamp-none [&>span]:flex-1 text-left">
                  <SelectValue placeholder="Select Property" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {MOCK_PROPERTIES.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id} className="text-xs py-2">
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-stone-900">{prop.title}</span>
                        <span className="text-[10px] text-stone-400 mt-0.5">{prop.location} • {prop.formattedPrice}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Notification Email (Confirmation & Reminder Destination) */}
          <div className="space-y-1.5 rounded-lg border border-stone-200/80 bg-stone-50/70 p-3">
            <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#0d4a36]" />
                <span>Client Notification Email</span>
              </span>
              <span className="text-[10px] text-stone-500 font-normal">Receives booking confirmation &amp; reminders</span>
            </label>
            <Input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="e.g. michael.a@gmail.com"
              className="bg-white text-xs h-8.5 border-stone-200 text-stone-900 font-mono placeholder:text-stone-400"
            />
          </div>

          {/* Live Broker Availability Selector */}
          <AvailabilitySelector
            propertyId={selectedPropertyId}
            brokerId={assignedBroker}
            selectedDate={selectedDate}
            onDateChange={(dateStr) => {
              setSelectedDate(dateStr);
              setSelectedSlot(null);
            }}
            selectedSlotId={selectedSlot?.id}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            disabled={isSubmitting}
          />

          {/* Meeting Format & Assigned Broker */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Viewing Format</label>
              <Select value={meetingType} onValueChange={setMeetingType}>
                <SelectTrigger className="bg-white text-xs h-9 border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person_viewing">In-Person Property Walkthrough</SelectItem>
                  <SelectItem value="vip_private_showing">Private VIP Showing</SelectItem>
                  <SelectItem value="virtual_tour">Live Video Walkthrough</SelectItem>
                  <SelectItem value="office_consultation">Office Briefing & Title Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700">Assigned Host Broker</label>
              <Select value={assignedBroker} onValueChange={setAssignedBroker}>
                <SelectTrigger className="bg-white text-xs h-9 border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broker_ade">Ade Admin (Senior Closer)</SelectItem>
                  <SelectItem value="broker_victoria">Victoria Okon (Senior Partner)</SelectItem>
                  <SelectItem value="broker_femi">Femi Davies (Ikoyi Specialist)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meeting Point / Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-stone-400" />
              <span>Inspection Location / Meeting Point</span>
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Property address or sales office meeting point"
              className="bg-white text-xs h-9 border-stone-200"
            />
          </div>

          {/* Internal Directives / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-700">Broker Notes & Directives</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions (e.g. client arriving with architect, prepare title deed document copies)..."
              className="bg-white text-xs min-h-[60px] border-stone-200"
            />
          </div>
        </div>

        {/* Clean Standard Dialog Footer */}
        <DialogFooter className="p-4 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs text-stone-700 bg-white hover:bg-stone-50 h-8"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleBook}
            disabled={isSubmitting || !selectedSlot}
            className="bg-[#0d4a36] hover:bg-[#0a3829] text-white text-xs h-8 shadow-2xs font-medium gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Schedule Inspection</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
