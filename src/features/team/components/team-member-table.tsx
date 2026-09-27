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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  MoreHorizontal,
  MapPin,
  Mail,
  Shield,
  Sliders,
  UserCheck,
  UserX,
  Trash2,
  Send,
} from "lucide-react";
import type { TeamMember, WorkspaceRole } from "../types";

export interface TeamMemberTableProps {
  members: TeamMember[];
  isLoading?: boolean;
  onSelectAgent?: (member: TeamMember) => void;
  onEditRole?: (member: TeamMember) => void;
  onToggleStatus?: (member: TeamMember) => void;
  onRemoveMember?: (member: TeamMember) => void;
  onResendInvite?: (member: TeamMember) => void;
}

export function TeamMemberTable({
  members,
  isLoading = false,
  onSelectAgent,
  onEditRole,
  onToggleStatus,
  onRemoveMember,
  onResendInvite,
}: TeamMemberTableProps) {
  const getRoleBadge = (role: WorkspaceRole) => {
    switch (role) {
      case "owner":
        return <Badge variant="hot">Workspace Owner</Badge>;
      case "admin":
        return <Badge variant="viewing">Operations Admin</Badge>;
      case "sales_manager":
        return <Badge variant="qualified">Sales Director</Badge>;
      case "sales_agent":
        return <Badge variant="inConversation">Luxury Broker</Badge>;
      case "viewer":
      default:
        return <Badge variant="secondary">Viewer</Badge>;
    }
  };

  const getMemberStatusString = (status: string) => {
    if (status === "active") return "Active";
    if (status === "suspended") return "Offline";
    if (status === "pending" || status === "invited") return "Pending";
    return "Pending";
  };

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white shadow-2xs overflow-hidden">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
            <TableHead className="min-w-[200px] text-stone-600 text-xs font-semibold">Member</TableHead>
            <TableHead className="min-w-[160px] text-stone-600 text-xs font-semibold">Role & Title</TableHead>
            <TableHead className="min-w-[180px] text-stone-600 text-xs font-semibold">Territory & Focus</TableHead>
            <TableHead className="min-w-[130px] text-stone-600 text-xs font-semibold">Lead Capacity</TableHead>
            <TableHead className="min-w-[110px] text-stone-600 text-xs font-semibold">Status</TableHead>
            <TableHead className="min-w-[100px] text-right text-stone-600 text-xs font-semibold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={`skeleton-row-${i}`}>
                <TableCell>
                  <div className="flex items-center gap-3 py-1">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5 py-1">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5 py-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-md" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                </TableCell>
              </TableRow>
            ))
          ) : members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="p-0 border-0">
                <EmptyState
                  preset="no-members"
                  title="No Team Members Found"
                  description="No members match your active filters. Clear your search or invite a new member."
                  size="compact"
                  className="border-0 rounded-none bg-transparent py-10"
                />
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const fullName =
                [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ||
                member.agent?.name ||
                member.invitedEmail ||
                "Team Member";

              const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              const email = member.user.email || member.invitedEmail || "—";
              const roleTitle = member.agent?.roleTitle || (member.role === "owner" ? "Agency Principal" : "Operations");

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
                      <div className="flex flex-col min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            member.agent
                              ? onSelectAgent?.(member)
                              : onEditRole?.(member)
                          }
                          className="font-medium text-stone-900 text-sm hover:underline hover:text-[#0d4a36] transition-colors text-left cursor-pointer truncate"
                        >
                          {fullName}
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                          <Mail className="h-3 w-3 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{email}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role & Title */}
                  <TableCell>
                    <div className="flex flex-col min-w-0">
                      <div>{getRoleBadge(member.role)}</div>
                      <span className="text-[11px] text-stone-500 truncate mt-1">
                        {roleTitle}
                      </span>
                    </div>
                  </TableCell>

                  {/* Territory & Focus */}
                  <TableCell>
                    {member.agent ? (
                      <div className="flex flex-col min-w-0 max-w-[210px]">
                        <span className="text-xs font-medium text-stone-900 truncate">
                          {member.agent.territory}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                          <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                          <span className="truncate">
                            {member.agent.specializations?.length
                              ? `${member.agent.specializations.length} specializations`
                              : "Prime Luxury Focus"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 italic">
                        Administrative clearance
                      </span>
                    )}
                  </TableCell>

                  {/* Capacity & Routing Weight */}
                  <TableCell>
                    {member.agent ? (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 text-xs tabular-nums">
                          {member.agent.activeLeadsCount} / {member.agent.maxConcurrentLeads} Leads
                        </span>
                        <span className="text-[10px] text-stone-600 bg-stone-100 border border-stone-200/80 px-1.5 py-0.2 rounded font-mono">
                          W:{member.agent.routingWeight}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge
                      status={getMemberStatusString(member.status)}
                      withDot
                    />
                  </TableCell>

                  {/* Action Column matching lead-intake-table standard */}
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {member.status === "invited" || member.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7.5 px-2.5 text-xs gap-1.5 whitespace-nowrap cursor-pointer hover:bg-amber-50/80 border-amber-200/90 bg-amber-50/40 text-amber-800"
                          onClick={() => onResendInvite?.(member)}
                          title="Resend workspace invitation email"
                        >
                          <Send className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>Resend</span>
                        </Button>
                      ) : member.agent ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7.5 px-2.5 text-xs gap-1 whitespace-nowrap cursor-pointer hover:bg-stone-50"
                          onClick={() => onSelectAgent?.(member)}
                        >
                          <span>Inspect</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7.5 px-2.5 text-xs gap-1 whitespace-nowrap cursor-pointer hover:bg-stone-50"
                          onClick={() => onEditRole?.(member)}
                        >
                          <span>Role</span>
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7.5 w-7.5 text-stone-500 hover:text-stone-900 cursor-pointer"
                            aria-label="More actions"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="text-xs font-semibold text-stone-500">
                            Member Actions
                          </DropdownMenuLabel>
                          {(member.status === "invited" || member.status === "pending") && (
                            <DropdownMenuItem
                              onClick={() => onResendInvite?.(member)}
                              className="text-xs cursor-pointer gap-2 text-stone-800 hover:text-stone-900"
                            >
                              <Send className="h-3.5 w-3.5 text-amber-600" />
                              <span>Resend Invite Email</span>
                            </DropdownMenuItem>
                          )}
                          {member.agent && (
                            <DropdownMenuItem
                              onClick={() => onSelectAgent?.(member)}
                              className="text-xs cursor-pointer gap-2"
                            >
                              <Sliders className="h-3.5 w-3.5 text-stone-500" />
                              <span>Routing Rules</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onEditRole?.(member)}
                            className="text-xs cursor-pointer gap-2"
                          >
                            <Shield className="h-3.5 w-3.5 text-stone-500" />
                            <span>Reassign Role</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onToggleStatus?.(member)}
                            className="text-xs cursor-pointer gap-2"
                          >
                            {member.status === "suspended" ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Reactivate Access</span>
                              </>
                            ) : (
                              <>
                                <UserX className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-amber-700">Suspend Access</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRemoveMember?.(member)}
                            className="text-xs cursor-pointer gap-2 text-rose-600 hover:text-rose-700 focus:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove Member</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
