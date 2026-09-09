"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/lib/context/workspace-context";
import { useAuth } from "@/lib/context/auth-context";
import { Shield, Bot, Check, Save } from "lucide-react";

export default function SettingsPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Container size="lg" className="space-y-6">
      <PageHeader
        title="Settings"
        description={`Workspace profile, autonomous AI behavior, and access controls for ${currentWorkspace.name}.`}
        actions={
          <Button
            onClick={handleSave}
            className="gap-1.5 bg-[#0d4a36] text-white hover:bg-[#0a3829] text-xs h-8"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Changes Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-stone-900">
                  Agency Workspace Profile
                </CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Primary agency entity details visible across client communications and viewings.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 uppercase text-[10px]">
                {currentWorkspace.tier}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">Workspace Name</label>
                  <Input defaultValue={currentWorkspace.name} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">Operational Email</label>
                  <Input defaultValue={user?.email || "sales@premier.co"} type="email" className="h-8 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">Primary Real Estate Market</label>
                  <Input defaultValue={currentWorkspace.primaryMarket} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-700">Default Currency</label>
                  <Input defaultValue={currentWorkspace.currency} className="h-8 text-xs" />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security & Access Box */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-700" />
              <span>Session & Access Control</span>
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              User identity and active session boundaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
              <span className="text-stone-600">Active Role</span>
              <span className="font-semibold text-stone-900">{user?.name || currentWorkspace.role}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
              <span className="text-stone-600">Multi-Factor Auth</span>
              <span className="font-semibold text-emerald-700">Enforced</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
              <span className="text-stone-600">API Access Scopes</span>
              <span className="font-semibold text-stone-900">Read / Write</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Autonomous Core Settings */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#0d4a36]" />
              <span>AI Autonomous Response Engine Configuration</span>
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Real-time parameters governing automatic prospect qualification, booking viewings, and WhatsApp routing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-stone-200 p-3 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800">Response Speed</span>
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">Instant</Badge>
                </div>
                <p className="text-[11px] text-stone-500">Average first reply under 4 seconds across channels.</p>
              </div>
              <div className="rounded-lg border border-stone-200 p-3 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800">Qualification Strictness</span>
                  <Badge variant="outline" className="text-stone-700 bg-stone-100 text-[10px]">Standard</Badge>
                </div>
                <p className="text-[11px] text-stone-500">Verifies budget, timeline, location preference, and financing.</p>
              </div>
              <div className="rounded-lg border border-stone-200 p-3 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800">Human Hand-off</span>
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 text-[10px]">Active</Badge>
                </div>
                <p className="text-[11px] text-stone-500">Auto-routes to on-duty brokers upon high-intent negotiation.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
