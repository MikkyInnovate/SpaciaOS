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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { teamService } from "../services/team-service";
import type { TeamMember, UpdateAgentRoutingPayload } from "../types";
import {
  Mail,
  Phone,
  Sliders,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AgentDetailDrawerProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentUpdated: (updatedMember: TeamMember) => void;
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

export function AgentDetailDrawer({
  member,
  open,
  onOpenChange,
  onAgentUpdated,
}: AgentDetailDrawerProps) {
  const agent = member?.agent;

  const [territory, setTerritory] = React.useState(agent?.territory || "Ikoyi & Banana Island");
  const [specializations, setSpecializations] = React.useState<string[]>(
    agent?.specializations || ["luxury_residential"]
  );
  const [routingWeight, setRoutingWeight] = React.useState(agent?.routingWeight || 10);
  const [maxCapacity, setMaxCapacity] = React.useState(agent?.maxConcurrentLeads || 50);
  const [isAvailable, setIsAvailable] = React.useState(agent?.isAvailableForRouting ?? true);
  const [status, setStatus] = React.useState<"active" | "busy" | "offline">(
    agent?.status || "active"
  );
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (member?.agent) {
      setTerritory(member.agent.territory);
      setSpecializations(member.agent.specializations || []);
      setRoutingWeight(member.agent.routingWeight);
      setMaxCapacity(member.agent.maxConcurrentLeads);
      setIsAvailable(member.agent.isAvailableForRouting);
      setStatus(member.agent.status);
    }
  }, [member]);

  if (!member || !agent) return null;

  const fullName =
    [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ||
    agent.name;

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSpecializationToggle = (specId: string) => {
    setSpecializations((prev) =>
      prev.includes(specId)
        ? prev.filter((s) => s !== specId)
        : [...prev, specId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: UpdateAgentRoutingPayload = {
        territory,
        specializations,
        routingWeight: Number(routingWeight),
        maxConcurrentLeads: Number(maxCapacity),
        isAvailableForRouting: isAvailable,
        status,
      };

      const updatedAgent = await teamService.updateAgentRouting(agent.id, payload);
      toast.success(`Routing configuration updated for ${fullName}.`);

      const updatedMember: TeamMember = {
        ...member,
        agent: {
          ...agent,
          ...updatedAgent,
        },
      };

      onAgentUpdated(updatedMember);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update routing configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const utilizationPercent = Math.min(
    100,
    Math.round((agent.activeLeadsCount / (agent.maxConcurrentLeads || 50)) * 100)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 border border-stone-200/80 bg-white shadow-xl rounded-xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-stone-100 bg-[#fcfcfb] text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200/70 text-[#0d4a36] shadow-2xs shrink-0">
              <Sliders className="h-4.5 w-4.5 text-[#0d4a36]" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-sm font-semibold text-stone-900 tracking-tight">
                Broker Routing Dossier
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Inspect lead allocation rules, territory assignments, and active pipeline capacity.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Agent Profile Summary Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-stone-50/70 rounded-lg border border-stone-200/70">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 border border-stone-200 shrink-0">
                {member.user.imageUrl ? (
                  <AvatarImage src={member.user.imageUrl} alt={fullName} />
                ) : null}
                <AvatarFallback className="bg-stone-200 text-stone-700 font-semibold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900 truncate">
                    {fullName}
                  </span>
                  <Badge variant="inConversation" className="text-[10px] py-0 px-2 shrink-0">
                    {agent.roleTitle || "Luxury Broker"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 text-stone-400 shrink-0" />
                    {agent.email}
                  </span>
                  {agent.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Phone className="h-3 w-3 text-stone-400 shrink-0" />
                        {agent.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
              <div className="text-right">
                <div className="text-[11px] font-medium text-stone-700">Lead routing</div>
                <div className="text-[10px] text-stone-400">
                  {isAvailable ? "Eligible for leads" : "Paused"}
                </div>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
                aria-label="Toggle routing availability"
              />
            </div>
          </div>

          {/* Capacity Progress Card */}
          <div className="space-y-1.5 p-3 rounded-lg border border-stone-200/70 bg-white">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Concurrent Lead Capacity</span>
              <span className="font-mono text-stone-600 text-xs tabular-nums">
                {agent.activeLeadsCount} / {maxCapacity} leads ({utilizationPercent}%)
              </span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/50">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  utilizationPercent > 80
                    ? "bg-rose-500"
                    : utilizationPercent > 50
                    ? "bg-amber-500"
                    : "bg-emerald-600"
                )}
                style={{ width: `${utilizationPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              {utilizationPercent >= 100
                ? "Broker is at maximum capacity. Incoming leads will be rerouted to alternative agents in this territory."
                : `Has ${Math.max(0, maxCapacity - agent.activeLeadsCount)} available slots for new qualified buyer viewings.`}
            </p>
          </div>

          {/* Territory & Dispatch Configuration */}
          <div className="space-y-3.5">
            <div className="border-b border-stone-100 pb-1.5">
              <h4 className="text-xs font-semibold text-stone-900">
                Routing Configuration
              </h4>
            </div>

            {/* Territory */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Assigned Territory</label>
              <Select value={territory} onValueChange={setTerritory}>
                <SelectTrigger className="h-8.5 text-xs bg-white border-stone-200 shadow-2xs">
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

            {/* Weight & Max Concurrent Leads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Routing Weight (Priority Bias)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={routingWeight}
                  onChange={(e) => setRoutingWeight(Number(e.target.value))}
                  className="text-xs h-8.5 bg-white border-stone-200 shadow-2xs"
                />
                <p className="text-[10px] text-stone-400">
                  Higher weights receive greater dispatch priority.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  Max Concurrent Leads
                </label>
                <Input
                  type="number"
                  min={5}
                  max={200}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="text-xs h-8.5 bg-white border-stone-200 shadow-2xs"
                />
                <p className="text-[10px] text-stone-400">
                  Lead intake automatically pauses when reached.
                </p>
              </div>
            </div>

            {/* Shift Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Agent Shift Status</label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as "active" | "busy" | "offline")}
              >
                <SelectTrigger className="h-8.5 text-xs bg-white border-stone-200 shadow-2xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-xs">Active (Online & Available)</SelectItem>
                  <SelectItem value="busy" className="text-xs">Busy (Conducting In-Person Viewings)</SelectItem>
                  <SelectItem value="offline" className="text-xs">Offline (Off-Duty / Leave)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Property Specializations */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700">
                Property Specializations
              </label>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                {AVAILABLE_SPECIALIZATIONS.map((spec) => {
                  const isChecked = specializations.includes(spec.id);
                  return (
                    <label
                      key={spec.id}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition-colors",
                        isChecked
                          ? "border-emerald-200 bg-emerald-50/50 text-[#0d4a36] font-medium"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleSpecializationToggle(spec.id)}
                        className="data-[state=checked]:bg-[#0d4a36] data-[state=checked]:border-[#0d4a36]"
                      />
                      <span className="truncate">{spec.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 hover:bg-stone-100 shadow-2xs cursor-pointer"
            disabled={isSaving}
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 gap-1.5 bg-[#0d4a36] hover:bg-[#0a3a2b] px-3.5 text-xs font-medium text-white shadow-2xs transition-colors cursor-pointer"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Rules...</span>
              </>
            ) : (
              <span>Save Routing Configuration</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
