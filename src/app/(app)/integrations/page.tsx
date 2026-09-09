"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Globe, Database, Check, Copy, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/lib/context/workspace-context";

export default function IntegrationsPage() {
  const { currentWorkspace } = useWorkspace();
  const [copied, setCopied] = React.useState(false);

  const copyWebhook = () => {
    navigator.clipboard.writeText("https://api.spacia.ai/v1/inbound/wh_sec_91k2f09ak21");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container size="lg" className="space-y-6">
      <PageHeader
        title="Integrations"
        description={`Connected calendars, webhooks, and property data sources for ${currentWorkspace.name}.`}
        actions={
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs font-medium">
            3 Active Connections
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Calendar Integration */}
        <Card className="border-stone-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-[#0d4a36]">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-stone-900">Google Calendar</CardTitle>
                  <CardDescription className="text-xs text-stone-500">Autonomous viewing booking</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-stone-500">
              Synced with broker team schedules. 45-min slots with 30-min buffer times between on-site viewings.
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-400 text-[11px]">
              <span>Last sync: 2 mins ago</span>
              <span className="text-emerald-700 font-medium">Real-time</span>
            </div>
          </CardContent>
        </Card>

        {/* Website Lead Capture */}
        <Card className="border-stone-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-stone-700">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-stone-900">Website Lead Inbound</CardTitle>
                  <CardDescription className="text-xs text-stone-500">Inquiry form webhook</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-stone-500">
              Receives instant lead payloads from property portal and agency website contact forms.
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-stone-500 truncate max-w-[140px]">
                wh_sec_91k2f...
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyWebhook}
                className="h-7 px-2 text-[11px] text-stone-600 gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CRM / Database Adapter */}
        <Card className="border-stone-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-stone-700">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-stone-900">Property Database</CardTitle>
                  <CardDescription className="text-xs text-stone-500">Inventory truth layer</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-stone-700 bg-stone-100 text-[10px]">
                Synced
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-stone-500">
              Bi-directional sync of property prices, bedroom counts, and availability flags (PRD Section 9).
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-400 text-[11px]">
              <span>24 listings active</span>
              <span className="text-stone-600 font-medium flex items-center gap-1">
                <RefreshCw className="h-2.5 w-2.5" /> Auto
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
