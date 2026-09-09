"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sliders, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useWorkspace } from "@/lib/context/workspace-context";

export default function AiAgentPage() {
  const { currentWorkspace } = useWorkspace();

  return (
    <Container size="lg" className="space-y-6">
      <PageHeader
        title="AI Sales Agent"
        description={`Voice model persona, qualification criteria, and guardrails for ${currentWorkspace.name}.`}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs font-medium">
              Voice Core Online
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Persona Card */}
        <Card className="lg:col-span-2 border-stone-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#0d4a36]" />
                  <span>Agent Persona & Voice Model</span>
                </CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Defines the AI voice identity representing the real-estate company (PRD Section 38 &amp; 40).
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                Production
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium">Identity Name</span>
                <p className="font-semibold text-stone-800">Spacia AI Sales Associate</p>
                <p className="text-[11px] text-stone-400">Identifies as agency sales desk</p>
              </div>
              <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium">Voice Model</span>
                <p className="font-semibold text-stone-800">Neural Executive (Lagos Business Neutral)</p>
                <p className="text-[11px] text-stone-400">Ultra-low latency speech engine</p>
              </div>
              <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium">Outbound Greeting</span>
                <p className="font-semibold text-stone-800">&ldquo;Hello from {currentWorkspace.name}...&rdquo;</p>
                <p className="text-[11px] text-stone-400">Verifies property inquiry directly</p>
              </div>
              <div className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 space-y-1">
                <span className="text-stone-500 text-[11px] font-medium">Verified Truth Policy</span>
                <p className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Enforced
                </p>
                <p className="text-[11px] text-stone-400">Never quotes unverified prices or terms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Guardrails */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0d4a36]" />
              <span>Guardrails & Safety</span>
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              PRD Section 18 verified data governance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
              <span className="text-stone-600">Max Outbound Attempts</span>
              <span className="font-semibold text-stone-900">3 Calls</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
              <span className="text-stone-600">Follow-up Stop on Unsubscribe</span>
              <span className="font-semibold text-emerald-700">Strict Stop</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
              <span className="text-stone-600">Off-hours Auto-Call</span>
              <span className="font-semibold text-stone-900">Queued to 9:00 AM</span>
            </div>
          </CardContent>
        </Card>

        {/* Qualification Engine Parameters */}
        <Card className="lg:col-span-3 border-stone-200">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#0d4a36]" />
              <span>Qualification Engine Parameters (PRD Section 14 &amp; 38)</span>
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Active criteria used to classify leads into HOT (&ge;80), WARM (50-79), or COLD (&lt;50).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-stone-200 p-3.5 bg-white space-y-1.5">
                <span className="text-xs font-semibold text-stone-800">Budget Qualification</span>
                <p className="text-[11px] text-stone-500">
                  Verifies verified minimum liquidity (&ge; ₦85M) or pre-approved mortgage allocation before viewing clearance.
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-3.5 bg-white space-y-1.5">
                <span className="text-xs font-semibold text-stone-800">Purchase Timeline</span>
                <p className="text-[11px] text-stone-500">
                  Prioritizes decision windows under 30 days for immediate broker booking; long-tail 6+ months enters nurture queue.
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-3.5 bg-white space-y-1.5">
                <span className="text-xs font-semibold text-stone-800">Escalation &amp; Handoff</span>
                <p className="text-[11px] text-stone-500">
                  Immediately transfers call to human broker upon price negotiation or unlisted bespoke architectural requests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
