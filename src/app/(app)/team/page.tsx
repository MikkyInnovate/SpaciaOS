"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Calendar, GitBranch } from "lucide-react";
import { useWorkspace } from "@/lib/context/workspace-context";

const AGENTS = [
  {
    name: "Tunde Bakare",
    initials: "TB",
    role: "Senior Sales Associate",
    territory: "Lekki Phase 1 & Ikate",
    status: "Active",
    calendar: "Connected",
    assignedLeads: 14,
  },
  {
    name: "Ngozi Eze",
    initials: "NE",
    role: "Luxury Portfolio Director",
    territory: "Ikoyi & Banana Island",
    status: "Active",
    calendar: "Connected",
    assignedLeads: 19,
  },
  {
    name: "Femi Adeleke",
    initials: "FA",
    role: "Commercial & Waterfront Lead",
    territory: "Victoria Island & Eko Atlantic",
    status: "Active",
    calendar: "Connected",
    assignedLeads: 11,
  },
];

export default function TeamPage() {
  const { currentWorkspace } = useWorkspace();

  return (
    <Container size="lg" className="space-y-6">
      <PageHeader
        title="Team"
        description={`Sales team roster and automated lead routing rules for ${currentWorkspace.name}.`}
        actions={
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs font-medium">
            3 Active Brokers
          </Badge>
        }
      />

      {/* Roster & Territory Routing */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AGENTS.map((agent) => (
            <Card key={agent.name} className="border-stone-200">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-stone-200">
                    <AvatarFallback className="bg-emerald-50 text-[#0d4a36] font-semibold text-xs">
                      {agent.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-900 truncate">{agent.name}</p>
                    <p className="text-[11px] text-stone-500 truncate">{agent.role}</p>
                  </div>
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">
                    {agent.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{agent.territory}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-500 text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Calendar className="h-3 w-3" /> Calendar Synced
                    </span>
                    <span>{agent.assignedLeads} active leads</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Routing Logic Overview */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-[#0d4a36]" />
              <span>Automated Lead Routing Logic (PRD Section 39)</span>
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              How qualified inquiries are assigned to human brokers for viewing execution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 space-y-1">
                <span className="text-stone-700 font-semibold">1. Territory-First Match</span>
                <p className="text-stone-500 text-[11px]">
                  Inquiries matching a specific development or district (e.g., Ikoyi) are routed directly to the dedicated territorial sales pod.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 space-y-1">
                <span className="text-stone-700 font-semibold">2. Calendar Availability Round-Robin</span>
                <p className="text-stone-500 text-[11px]">
                  When a prospect confirms a viewing time slot, the system selects the available broker with the fewest active bookings that day.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
