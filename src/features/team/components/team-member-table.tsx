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
import { Input } from "@/components/ui/input";
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
  Search,
  ChevronRight,
  MoreHorizontal,
  MapPin,
  Mail,
  Shield,
  Sliders,
  UserCheck,
  UserX,
  Trash2,
} from "lucide-react";
import type { TeamMember, WorkspaceRole } from "../types";
import { cn } from "@/lib/utils/cn";

export interface TeamMemberTableProps {
  members: TeamMember[];
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (filter: string) => void;
  onSelectAgent?: (member: TeamMember) => void;
  onEditRole?: (member: TeamMember) => void;
  onToggleStatus?: (member: TeamMember) => void;
  onRemoveMember?: (member: TeamMember) => void;
}

export function TeamMemberTable({
  members,
  isLoading = false,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onSelectAgent,
  onEditRole,
  onToggleStatus,
  onRemoveMember,
}: TeamMemberTableProps) {
  // Filtered members list
  const filteredMembers = React.useMemo(() => {
    return members.filter((member) => {
      const fullName = [member.user.firstName, member.user.lastName]
        .filter(Boolean)
        .join(" ") || member.agent?.name || "";
      const email = member.user.email || member.invitedEmail || "";
      const territory = member.agent?.territory || "";

      const matchesSearch =
        searchQuery === "" ||
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        territory.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "brokers" &&
          (member.role === "sales_agent" || member.role === "sales_manager")) ||
        member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

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
    if (status === "pending") return "Pending";
    return "Contacting";
  };

  return (
    <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
      {/* Homepage-style Integrated Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border p-4 bg-stone-50/50 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-bold text-stone-900">
              Team & Broker Directory
            </h2>
            <span className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Directory
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Licensed luxury advisors, territory routing dispatchers & administrative clearance
          </p>
        </div>

        {/* Integrated Filter Style matching Home Page */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Input */}
          <div className="relative w-44 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 text-xs h-8 bg-white border-stone-200 shadow-2xs"
            />
          </div>

          {/* Segmented Filter Bar matching operations-activity-feed */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200/80">
            {[
              { id: "all", label: `All (${members.length})` },
              { id: "brokers", label: "Brokers" },
              { id: "admin", label: "Admins" },
              { id: "owner", label: "Owners" },
            ].map((tab) => {
              const isSelected = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onRoleFilterChange(tab.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-all select-none whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-white text-stone-900 font-semibold shadow-2xs border border-stone-200/60"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table matching lead-intake-table standard */}
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px] whitespace-nowrap">Member</TableHead>
            <TableHead className="min-w-[160px] whitespace-nowrap">Role & Title</TableHead>
            <TableHead className="min-w-[170px] whitespace-nowrap">Territory & Focus</TableHead>
            <TableHead className="min-w-[120px] whitespace-nowrap">Lead Capacity</TableHead>
            <TableHead className="min-w-[110px] whitespace-nowrap">Status</TableHead>
            <TableHead className="min-w-[110px] text-right whitespace-nowrap">Action</TableHead>
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
          ) : filteredMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="p-0 border-0">
                <EmptyState
                  preset="no-leads"
                  title="No Team Members Found"
                  description="No members match your search criteria. Clear your search or invite a new member."
                  size="compact"
                  className="border-0 rounded-none bg-transparent py-8"
                />
              </TableCell>
            </TableRow>
          ) : (
            filteredMembers.map((member) => {
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
              const roleTitle = member.agent?.roleTitle || (member.role === "owner" ? "Agency Executive" : "Operations");

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
                          className="font-semibold text-stone-900 text-sm hover:underline hover:text-[#0d4a36] transition-colors text-left cursor-pointer truncate"
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
                          {member.agent.activeLeadsCount}/{member.agent.maxConcurrentLeads}
                        </span>
                        <span className="text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded font-mono">
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
                      {member.agent ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs gap-1 whitespace-nowrap cursor-pointer hover:bg-stone-50"
                          onClick={() => onSelectAgent?.(member)}
                        >
                          <span>Inspect</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs gap-1 whitespace-nowrap cursor-pointer hover:bg-stone-50"
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
                            className="h-7 w-7 text-stone-500 hover:text-stone-900 cursor-pointer"
                            aria-label="More actions"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs font-semibold text-stone-500">
                            Member Actions
                          </DropdownMenuLabel>
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
