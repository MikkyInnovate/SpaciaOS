"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  MapPin,
  Shield,
  Sliders,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Zap,
} from "lucide-react";
import type { TeamMember, WorkspaceRole } from "../types";
import { cn } from "@/lib/utils/cn";

export interface TeamMemberTableProps {
  members: TeamMember[];
  isLoading?: boolean;
  onSelectAgent?: (member: TeamMember) => void;
  onEditRole?: (member: TeamMember) => void;
  onToggleStatus?: (member: TeamMember) => void;
  onRemoveMember?: (member: TeamMember) => void;
}

const ROLE_CONFIG: Record<
  WorkspaceRole,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  owner: {
    label: "Workspace Owner",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200/90",
    dotClass: "bg-rose-600",
  },
  admin: {
    label: "Operations Admin",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200/90",
    dotClass: "bg-indigo-600",
  },
  sales_manager: {
    label: "Sales Director",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
    dotClass: "bg-emerald-600",
  },
  sales_agent: {
    label: "Luxury Broker",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200/90",
    dotClass: "bg-sky-600",
  },
  viewer: {
    label: "Auditor / Viewer",
    badgeClass: "bg-stone-50 text-stone-700 border-stone-200/90",
    dotClass: "bg-stone-500",
  },
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  active: {
    label: "Active",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    dotClass: "bg-emerald-500",
  },
  invited: {
    label: "Invited",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80",
    dotClass: "bg-blue-500",
  },
  pending: {
    label: "Pending",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
    dotClass: "bg-amber-500",
  },
  suspended: {
    label: "Suspended",
    badgeClass: "bg-stone-100 text-stone-600 border-stone-200/80",
    dotClass: "bg-stone-400",
  },
};

export function TeamMemberTable({
  members,
  isLoading = false,
  onSelectAgent,
  onEditRole,
  onToggleStatus,
  onRemoveMember,
}: TeamMemberTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white shadow-2xs p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white shadow-2xs p-12 text-center">
        <Shield className="h-10 w-10 text-stone-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-stone-900">No team members found</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          No members match your search criteria. Invite your brokerage partners or clear the active filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
            <TableHead className="min-w-[220px] text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
              Member
            </TableHead>
            <TableHead className="min-w-[170px] text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
              Assigned Role
            </TableHead>
            <TableHead className="min-w-[130px] text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
              Member State
            </TableHead>
            <TableHead className="min-w-[200px] text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
              Routing & Territory
            </TableHead>
            <TableHead className="w-[80px] text-right text-stone-600 font-semibold text-[11px] uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const fullName = [member.user.firstName, member.user.lastName]
              .filter(Boolean)
              .join(" ") || member.agent?.name || member.invitedEmail || "Team Member";

            const initials = fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            const roleCfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
            const statusCfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;

            return (
              <TableRow
                key={member.id}
                className="group hover:bg-stone-50/80 transition-colors"
              >
                {/* Member Avatar + Name + Email */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-stone-200 shrink-0">
                      {member.user.imageUrl ? (
                        <AvatarImage src={member.user.imageUrl} alt={fullName} />
                      ) : null}
                      <AvatarFallback className="bg-stone-100 text-stone-700 font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-900 truncate">
                          {fullName}
                        </span>
                        {member.agent && (
                          <span className="text-[10px] bg-emerald-50 text-[#0d4a36] font-medium px-1.5 py-0.2 rounded border border-emerald-200/80">
                            Agent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500 truncate mt-0.5">
                        <Mail className="h-3 w-3 text-stone-400 shrink-0" />
                        <span className="truncate">{member.user.email || member.invitedEmail}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Role & Title */}
                <TableCell>
                  <div className="space-y-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border shadow-2xs",
                        roleCfg.badgeClass
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", roleCfg.dotClass)} />
                      {roleCfg.label}
                    </span>
                    {member.agent?.roleTitle && (
                      <p className="text-[11px] text-stone-500 truncate font-normal">
                        {member.agent.roleTitle}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Status Tag */}
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border shadow-2xs",
                      statusCfg.badgeClass
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusCfg.dotClass)} />
                    {statusCfg.label}
                  </span>
                </TableCell>

                {/* Lead Routing & Territory */}
                <TableCell>
                  {member.agent ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{member.agent.territory}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-amber-500" />
                          Weight: {member.agent.routingWeight}
                        </span>
                        <span>•</span>
                        <span>
                          {member.agent.activeLeadsCount}/{member.agent.maxConcurrentLeads} Leads
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-stone-400 italic">
                      Non-broker account
                    </span>
                  )}
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-stone-500 hover:text-stone-900 cursor-pointer"
                        aria-label="Open member actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel className="text-xs font-semibold text-stone-500">
                        Manage Member
                      </DropdownMenuLabel>
                      
                      {member.agent && onSelectAgent && (
                        <DropdownMenuItem
                          onClick={() => onSelectAgent(member)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          <Sliders className="h-3.5 w-3.5 text-stone-500" />
                          <span>Inspect Agent Routing</span>
                        </DropdownMenuItem>
                      )}

                      {onEditRole && (
                        <DropdownMenuItem
                          onClick={() => onEditRole(member)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          <Shield className="h-3.5 w-3.5 text-stone-500" />
                          <span>Reassign Member Role</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {onToggleStatus && (
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(member)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          {member.status === "suspended" ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Reactivate Member</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-3.5 w-3.5 text-amber-600" />
                              <span className="text-amber-700">Suspend Member</span>
                            </>
                          )}
                        </DropdownMenuItem>
                      )}

                      {onRemoveMember && (
                        <DropdownMenuItem
                          onClick={() => onRemoveMember(member)}
                          className="text-xs cursor-pointer gap-2 text-rose-600 hover:text-rose-700 focus:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove from Workspace</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
