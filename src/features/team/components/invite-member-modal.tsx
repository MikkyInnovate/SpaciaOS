"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { teamService } from "../services/team-service";
import type { InviteMemberPayload, TeamMember, WorkspaceRole } from "../types";
import { Sparkles, UserPlus, Loader2 } from "lucide-react";

export interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberInvited: (newMember: TeamMember) => void;
}

const AVAILABLE_SPECIALIZATIONS = [
  { id: "luxury_residential", label: "Luxury Residential" },
  { id: "waterfront", label: "Waterfront & Marina" },
  { id: "penthouses", label: "Sky Penthouses" },
  { id: "commercial", label: "Commercial & Office" },
  { id: "investment_yield", label: "High-Yield Buy-to-Let" },
  { id: "land_development", label: "Land & Greenfield Sites" },
];

const LAGOS_TERRITORIES = [
  "Ikoyi & Banana Island",
  "Victoria Island & Eko Atlantic",
  "Lekki Phase 1 & Ikate",
  "Chevron & Orchid Corridor",
  "Ikeja GRA & Mainland Prime",
  "Epe Expressway & Free Zone",
  "Abuja Maitama & Guzape",
];

export function InviteMemberModal({
  open,
  onOpenChange,
  onMemberInvited,
}: InviteMemberModalProps) {
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [role, setRole] = React.useState<WorkspaceRole>("sales_agent");
  const [phone, setPhone] = React.useState("");
  const [roleTitle, setRoleTitle] = React.useState("");
  const [territory, setTerritory] = React.useState("Ikoyi & Banana Island");
  const [specializations, setSpecializations] = React.useState<string[]>([
    "luxury_residential",
    "waterfront",
  ]);
  const [routingWeight, setRoutingWeight] = React.useState(15);
  const [maxCapacity, setMaxCapacity] = React.useState(50);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isBroker = role === "sales_agent" || role === "sales_manager";

  const handleSpecializationToggle = (specId: string) => {
    setSpecializations((prev) =>
      prev.includes(specId)
        ? prev.filter((s) => s !== specId)
        : [...prev, specId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: InviteMemberPayload = {
        email: email.trim().toLowerCase(),
        role,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      };

      if (isBroker) {
        payload.phone = phone.trim() || undefined;
        payload.roleTitle = roleTitle.trim() || (role === "sales_manager" ? "Sales Director" : "Luxury Broker");
        payload.territory = territory;
        payload.specializations = specializations;
        payload.routingWeight = Number(routingWeight) || 10;
        payload.maxConcurrentLeads = Number(maxCapacity) || 50;
      }

      const invited = await teamService.inviteMember(payload);
      toast.success(`Invitation sent to ${email} as ${role}.`);
      onMemberInvited(invited);
      onOpenChange(false);

      // Reset form
      setEmail("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setRoleTitle("");
      setRole("sales_agent");
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 border border-stone-200/80 bg-white shadow-xl rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header matching LeadIntakeDialog */}
          <DialogHeader className="p-5 pb-4 border-b border-stone-100 bg-[#fcfcfb] text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200/70 text-[#0d4a36] shadow-2xs shrink-0">
                <UserPlus className="h-4.5 w-4.5 text-[#0d4a36]" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-sm font-semibold text-stone-900 tracking-tight">
                  Invite Team Member
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Add a new luxury broker, operations administrator, or partner to your workspace.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="e.g. adewale@spacia.luxury"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs h-8.5 bg-white border-stone-200"
                required
              />
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">First Name</label>
                <Input
                  placeholder="Adewale"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-xs h-8.5 bg-white border-stone-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Last Name</label>
                <Input
                  placeholder="Tinubu"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs h-8.5 bg-white border-stone-200"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Assigned Role <span className="text-rose-500">*</span>
              </label>
              <Select value={role} onValueChange={(val) => setRole(val as WorkspaceRole)}>
                <SelectTrigger className="text-xs h-8.5 bg-white border-stone-200">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_agent" className="text-xs">
                    Licensed Luxury Broker (Viewings & Lead Intake)
                  </SelectItem>
                  <SelectItem value="sales_manager" className="text-xs">
                    Sales Director / Manager (Pipeline Supervision)
                  </SelectItem>
                  <SelectItem value="admin" className="text-xs">
                    Operations Admin (Full Team & Settings Authority)
                  </SelectItem>
                  <SelectItem value="owner" className="text-xs">
                    Workspace Owner (Unrestricted Organization Authority)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Broker-specific fields */}
            {isBroker && (
              <div className="p-3.5 bg-stone-50/70 rounded-lg border border-stone-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0d4a36]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Broker Lead Routing Profile</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-stone-700">Phone Number</label>
                    <Input
                      placeholder="+234 800 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-xs h-8 bg-white border-stone-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-stone-700">Professional Title</label>
                    <Input
                      placeholder="e.g. Senior Portfolio Lead"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="text-xs h-8 bg-white border-stone-200"
                    />
                  </div>
                </div>

                {/* Territory */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-stone-700">Primary Territory</label>
                  <Select value={territory} onValueChange={setTerritory}>
                    <SelectTrigger className="text-xs h-8 bg-white border-stone-200">
                      <SelectValue placeholder="Select territory" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAGOS_TERRITORIES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Specializations */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Property Specializations
                  </label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {AVAILABLE_SPECIALIZATIONS.map((spec) => (
                      <label
                        key={spec.id}
                        className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer"
                      >
                        <Checkbox
                          checked={specializations.includes(spec.id)}
                          onCheckedChange={() => handleSpecializationToggle(spec.id)}
                        />
                        <span>{spec.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Weight & Capacity */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-stone-700">
                      Routing Weight (1-100)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={routingWeight}
                      onChange={(e) => setRoutingWeight(Number(e.target.value))}
                      className="text-xs h-8 bg-white border-stone-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-stone-700">
                      Max Active Leads
                    </label>
                    <Input
                      type="number"
                      min={5}
                      max={200}
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="text-xs h-8 bg-white border-stone-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer matching standard DialogFooter */}
          <DialogFooter className="p-4 border-t border-stone-100 bg-[#fcfcfb] flex items-center justify-between sm:justify-between w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-8 bg-[#0d4a36] hover:bg-[#0a3a2b] text-white cursor-pointer gap-1.5 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending Invitation...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Send Invitation</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
