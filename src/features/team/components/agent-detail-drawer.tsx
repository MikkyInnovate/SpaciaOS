"use client";

import * as React from "react";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  MapPin,
  Phone,
  Mail,
  Zap,
  CheckCircle2,
  Sliders,
  Shield,
  Loader2,
  Calendar,
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
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Broker Routing Dossier"
      description="Inspect lead allocation rules, territory assignments, and active pipeline capacity."
      icon={<Sliders className="h-4.5 w-4.5" />}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
            disabled={isSaving}
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="text-xs bg-[#0d4a36] hover:bg-[#0a3a2b] text-white cursor-pointer gap-1.5"
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
        </div>
      }
    >
      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex items-start justify-between p-4 bg-stone-50 rounded-lg border border-stone-200/80">
          <div className="flex items-center gap-3.5">
            <Avatar className="h-12 w-12 border border-stone-200">
              {member.user.imageUrl ? (
                <AvatarImage src={member.user.imageUrl} alt={fullName} />
              ) : null}
              <AvatarFallback className="bg-stone-200 text-stone-800 font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-serif font-bold text-stone-900">{fullName}</h3>
                <span className="text-[10px] bg-emerald-50 text-[#0d4a36] font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                  {agent.roleTitle || "Luxury Real Estate Advisor"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-stone-400" />
                  {agent.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-stone-400" />
                  {agent.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-700">Dispatch Routing:</span>
            <Switch
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
              aria-label="Toggle routing availability"
            />
          </div>
        </div>

        {/* Capacity & Performance Telemetry */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-700">Concurrent Lead Capacity</span>
            <span className="text-stone-500">
              {agent.activeLeadsCount} / {maxCapacity} leads ({utilizationPercent}%)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200/60">
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
          <p className="text-[11px] text-stone-500">
            {utilizationPercent >= 100
              ? "Broker is at maximum capacity. Incoming leads will be rerouted to alternative agents in this territory."
              : `Has ${Math.max(0, maxCapacity - agent.activeLeadsCount)} available slots for new qualified buyer viewings.`}
          </p>
        </div>

        {/* Territory & Dispatch Configuration */}
        <div className="space-y-4 pt-2 border-t border-stone-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Routing Configuration
          </h4>

          {/* Territory */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Assigned Territory</label>
            <Select value={territory} onValueChange={setTerritory}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select territory" />
              </SelectTrigger>
              <SelectContent>
                {LAGOS_TERRITORIES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight & Max Concurrent Leads */}
          <div className="grid grid-cols-2 gap-4">
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
                className="text-xs"
              />
              <p className="text-[10px] text-stone-400">
                Higher weights receive a greater proportion of inbound leads.
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
                className="text-xs"
              />
              <p className="text-[10px] text-stone-400">
                Lead intake automatically pauses when this cap is reached.
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Agent Shift Status</label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as "active" | "busy" | "offline")}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active (Online & Available)</SelectItem>
                <SelectItem value="busy">Busy (Conducting In-Person Viewings)</SelectItem>
                <SelectItem value="offline">Offline (Off-Duty / Leave)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Property Specializations */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">
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
        </div>
      </div>
    </DetailDrawer>
  );
}
