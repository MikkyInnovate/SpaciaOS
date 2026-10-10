"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Building,
  CheckCircle,
  ShieldCheck,
  Send,
} from "lucide-react";

interface Slot {
  time: string;
  available: boolean;
  assignedBroker: string;
}

const SAMPLE_SLOTS: Slot[] = [
  { time: "09:30 AM", available: false, assignedBroker: "Reserved (T. Cole)" },
  { time: "11:30 AM", available: true, assignedBroker: "Babatunde Adeleke" },
  { time: "01:00 PM", available: false, assignedBroker: "Booked (VIP Client)" },
  { time: "02:30 PM", available: true, assignedBroker: "Babatunde Adeleke" },
  { time: "04:00 PM", available: true, assignedBroker: "Amina Yusuf" },
];

export function InspectionSchedulerPreview() {
  const [selectedSlot, setSelectedSlot] = useState<string>("11:30 AM");
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  return (
    <div className="w-full bg-white rounded-xl border border-[#e8e8e6] shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>TWO-WAY GOOGLE CALENDAR SYNC ENGINE</span>
          </div>
          <h3 className="font-display font-bold text-lg text-stone-900">
            Autonomous Property Inspection Scheduling
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            When an AI voice conversation qualifies a buyer, SpaciaOS checks broker availability in real time and secures the slot with zero double-booking risk.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Mutex Lock Guard Active
          </span>
        </div>
      </div>

      {/* Date & Slot Picker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date Context */}
        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
            <CalendarIcon className="w-4 h-4 text-emerald-700" />
            <span>Inspection Date</span>
          </div>
          <div className="p-3 bg-white rounded-md border border-stone-200 shadow-2xs text-xs space-y-1">
            <div className="text-[11px] text-stone-400 font-mono">SELECTED DATE</div>
            <div className="font-bold text-stone-900 text-sm">Saturday, Oct 3, 2026</div>
            <div className="text-[11px] text-emerald-700 font-medium">
              3 High-Capacity Slots Available
            </div>
          </div>
          <div className="text-[11px] text-stone-500 leading-relaxed">
            Timezone normalized to West Africa Time (WAT / UTC+1). Synchronized across Google Workspace & Microsoft 365.
          </div>
        </div>

        {/* Available Time Slots */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" /> Available Broker Slots
            </span>
            <span className="text-[11px] text-stone-500 font-mono">LIVE CONFLICT LOCKOUT</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAMPLE_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot.time;
              return (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => {
                    setSelectedSlot(slot.time);
                    setIsConfirmed(false);
                  }}
                  className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                    !slot.available
                      ? "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60"
                      : isSelected
                      ? "bg-stone-900 border-stone-900 text-white shadow-2xs"
                      : "bg-white border-stone-200 text-stone-800 hover:border-stone-400"
                  }`}
                >
                  <div>
                    <div className="font-mono font-bold text-xs">{slot.time}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? "text-stone-300" : "text-stone-500"
                      }`}
                    >
                      {slot.assignedBroker}
                    </div>
                  </div>

                  {slot.available ? (
                    isSelected ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                        Open
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-500">
                      Locked
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation State Action Card */}
      <div className="p-4 rounded-lg bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 font-semibold text-stone-900">
            <Building className="w-4 h-4 text-stone-700" />
            <span>The Glass House, Ikoyi Waterfront</span>
            <span className="text-stone-400">•</span>
            <span className="text-emerald-700 font-mono font-bold">{selectedSlot}</span>
          </div>
          <div className="text-[11px] text-stone-500">
            Assigned: Babatunde Adeleke (Senior Partner) • Auto-Dispatched via Resend & WhatsApp
          </div>
        </div>

        <button
          onClick={() => setIsConfirmed(true)}
          disabled={isConfirmed}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold shadow-2xs transition-all ${
            isConfirmed
              ? "bg-emerald-800 text-white cursor-default"
              : "bg-[#0d4a36] hover:bg-[#093829] text-white"
          }`}
        >
          {isConfirmed ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              <span>Inspection Confirmed!</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Confirm Viewing Slot</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
