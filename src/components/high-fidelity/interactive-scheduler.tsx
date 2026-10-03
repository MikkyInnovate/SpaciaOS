"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Check, Send, QrCode } from "lucide-react";
import { toast } from "sonner";

interface Slot {
  time: string;
  available: boolean;
  assignedBroker: string;
}

const SAMPLE_SLOTS: Slot[] = [
  { time: "09:30 AM", available: false, assignedBroker: "Reserved (T. Cole)" },
  { time: "11:30 AM", available: true, assignedBroker: "Babatunde Adeleke (Sr. Partner)" },
  { time: "01:00 PM", available: false, assignedBroker: "Booked (VIP Client)" },
  { time: "02:30 PM", available: true, assignedBroker: "Babatunde Adeleke (Sr. Partner)" },
  { time: "04:00 PM", available: true, assignedBroker: "Amina Yusuf (Associate)" },
];

export function InteractiveScheduler() {
  const [selectedSlot, setSelectedSlot] = useState<string>("11:30 AM");
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const handleConfirm = () => {
    setIsConfirmed(true);
    toast.success("Inspection slot confirmed on broker Google Calendar.");
  };

  return (
    <section id="scheduling" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
          03 // SCHEDULING INTEGRATION
        </span>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight">
          From conversational phone call to confirmed on-site viewing.
        </h2>
        <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
          Queries broker calendars in real time, prevents conflict collisions, and locks out viewing slots automatically.
        </p>
      </div>

      <div className="w-full bg-white rounded-xl border border-zinc-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
          <div>
            <h3 className="font-bold text-base text-zinc-950">
              Live Inspection Slot Picker
            </h3>
            <p className="text-xs text-zinc-500">
              In-memory mutex locks protect against double-booking across team calendars.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded border border-zinc-200 text-[11px] font-mono text-zinc-600 self-start sm:self-auto">
            2-WAY GOOGLE CALENDAR SYNC
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Context */}
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
              <CalendarIcon className="w-4 h-4 text-zinc-700" />
              <span>Inspection Date</span>
            </div>
            <div className="p-3 bg-white rounded border border-zinc-200 text-xs space-y-1">
              <div className="text-[10px] text-zinc-400 font-mono">SELECTED DATE</div>
              <div className="font-bold text-zinc-950">Saturday, Oct 3, 2026</div>
              <div className="text-[11px] text-zinc-600 font-mono">3 Slots Open</div>
            </div>
            <div className="text-[11px] text-zinc-500">
              WAT / UTC+1 Normalized &bull; Google & MS 365
            </div>
          </div>

          {/* Slots */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-700" /> Available Windows
              </span>
              <span className="text-[10px] font-mono text-zinc-400">CONFLICT LOCKOUT</span>
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
                    className={`p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                      !slot.available
                        ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed"
                        : isSelected
                        ? "bg-zinc-950 border-zinc-950 text-white"
                        : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold">{slot.time}</div>
                      <div
                        className={`text-[10px] ${
                          isSelected ? "text-zinc-300" : "text-zinc-500"
                        }`}
                      >
                        {slot.assignedBroker}
                      </div>
                    </div>

                    {slot.available ? (
                      isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          Open
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-500">
                        Locked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirmation Trigger */}
        <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold text-zinc-950">
              The Glass House, Ikoyi Waterfront &bull; {selectedSlot}
            </div>
            <div className="text-[11px] text-zinc-500">
              Lead: Dr. Folake Alabi &bull; Assigned Broker: Babatunde Adeleke
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={isConfirmed}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
              isConfirmed
                ? "bg-zinc-800 text-white cursor-default"
                : "bg-zinc-950 hover:bg-zinc-800 text-white"
            }`}
          >
            {isConfirmed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Viewing Confirmed (#SP-8921)</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Viewing Slot</span>
              </>
            )}
          </button>
        </div>

        {/* Confirmed Gate Pass */}
        {isConfirmed && (
          <div className="p-3.5 rounded-lg border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-zinc-800" />
              <div>
                <div className="font-bold text-[11px]">Security Gate Pass Dispatched</div>
                <div className="text-[10px] text-zinc-600 font-mono">
                  Ref: SP-IKOYI-8921 &bull; SMS access PIN delivered to prospect.
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 border border-zinc-300 px-2 py-0.5 rounded bg-white">
              CALENDAR INVITE WRITTEN
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
