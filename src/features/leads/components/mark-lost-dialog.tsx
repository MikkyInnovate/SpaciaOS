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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LossDetails, LossReasonCategory } from "../types";
import { AlertCircle, UserX } from "lucide-react";

export interface MarkLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName?: string;
  onConfirm: (lossDetails: LossDetails) => void;
}

const LOSS_REASONS: Array<{ value: LossReasonCategory; label: string }> = [
  { value: "budget_mismatch", label: "Budget Below Minimum Entry Floor" },
  { value: "purchased_competitor", label: "Acquired Alternative Competitor Property" },
  { value: "unresponsive", label: "Unresponsive After Repeated Multichannel Outreach" },
  { value: "unrealistic_criteria", label: "Unrealistic Location / Price Criteria" },
  { value: "title_deed_dispute", label: "Disputed Legal Title / Unacceptable Deed" },
  { value: "other", label: "Other Commercial Disqualification" },
];

export function MarkLostDialog({
  open,
  onOpenChange,
  leadName,
  onConfirm,
}: MarkLostDialogProps) {
  const [reason, setReason] = React.useState<LossReasonCategory>("budget_mismatch");
  const [notes, setNotes] = React.useState("");

  const handleConfirm = () => {
    const selected = LOSS_REASONS.find((r) => r.value === reason);
    const lossDetails: LossDetails = {
      reason,
      reasonLabel: selected?.label || "Commercial Disqualification",
      notes: notes.trim() || undefined,
      lostAt: "Just now",
    };

    onConfirm(lossDetails);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <UserX className="h-4 w-4" />
            </div>
            <span>Mark Deal as Lost</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Transition <strong>{leadName || "this prospect"}</strong> to Lost status. This will halt all autonomous AI voice calls and automated messaging sequences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Disqualification Reason</label>
            <Select value={reason} onValueChange={(v) => setReason(v as LossReasonCategory)}>
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Operational Disposition Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prospect could only wire ₦40M max, declined mortgage structuring."
              className="text-xs min-h-[75px] bg-white resize-none"
            />
          </div>

          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-snug">
              This deal will be archived and excluded from active sales conversion funnels.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-2xs font-semibold"
          >
            Confirm Mark as Lost
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
