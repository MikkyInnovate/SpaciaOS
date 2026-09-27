"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import type { RoleDefinition } from "../types";
import { cn } from "@/lib/utils/cn";

export interface RoleGuidePanelProps {
  roles: RoleDefinition[];
}

export function RoleGuidePanel({ roles }: RoleGuidePanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="border-stone-200/80 bg-white shadow-2xs">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer border-b border-stone-100 hover:bg-stone-50/50 transition-colors" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#0d4a36]" />
          <CardTitle className="text-xs font-semibold text-stone-900">
            Role-Based Access Control (RBAC) & Governance Matrix
          </CardTitle>
          <span className="text-[11px] text-stone-400 font-normal">
            ({roles.length} roles defined)
          </span>
        </div>
        <button
          type="button"
          className="text-stone-400 hover:text-stone-700 p-1"
          aria-label={isOpen ? "Collapse role guide" : "Expand role guide"}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-stone-50/40">
          {roles.map((r) => (
            <div
              key={r.role}
              className="bg-white p-3.5 rounded-lg border border-stone-200/70 shadow-2xs space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900">{r.title}</h4>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {r.role.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {r.description}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-1">
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Permissions
                </span>
                <div className="flex flex-wrap gap-1">
                  {r.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
