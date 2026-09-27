"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useWorkspace } from "@/lib/context/workspace-context";
import {
  TeamStatsStrip,
  TeamMemberTable,
  InviteMemberModal,
  EditRoleModal,
  AgentDetailDrawer,
  RoleGuidePanel,
  teamService,
} from "@/features/team";
import type { TeamMember, TeamStats, RoleDefinition } from "@/features/team/types";
import { toast } from "sonner";
import { UserPlus, RefreshCw, Building2 } from "lucide-react";

export default function TeamPage() {
  const { currentWorkspace } = useWorkspace();

  const [stats, setStats] = React.useState<TeamStats | null>(null);
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [roles, setRoles] = React.useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");

  // Modals & Drawers state
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [selectedAgentMember, setSelectedAgentMember] = React.useState<TeamMember | null>(null);
  const [editingRoleMember, setEditingRoleMember] = React.useState<TeamMember | null>(null);
  const [removingMember, setRemovingMember] = React.useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const loadTeamData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [fetchedStats, fetchedMembers, fetchedRoles] = await Promise.all([
        teamService.getStats(),
        teamService.listMembers(),
        teamService.getRoles(),
      ]);

      setStats(fetchedStats);
      setMembers(fetchedMembers);
      setRoles(fetchedRoles);
    } catch (err: any) {
      toast.error("Failed to load team data from workspace.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadTeamData();
  }, [loadTeamData, currentWorkspace?.id]);

  // Handlers
  const handleMemberInvited = (newMember: TeamMember) => {
    setMembers((prev) => [newMember, ...prev]);
    loadTeamData(true);
  };

  const handleRoleUpdated = (updatedMember: TeamMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    loadTeamData(true);
  };

  const handleAgentUpdated = (updatedMember: TeamMember) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    loadTeamData(true);
  };

  const handleToggleStatus = async (member: TeamMember) => {
    const nextStatus = member.status === "suspended" ? "active" : "suspended";
    try {
      const updated = await teamService.updateStatus(member.id, { status: nextStatus });
      toast.success(
        `Member ${nextStatus === "active" ? "reactivated" : "suspended"} successfully.`
      );
      setMembers((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      loadTeamData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update member status.");
    }
  };

  const handleConfirmRemove = async () => {
    if (!removingMember) return;
    setIsRemoving(true);
    try {
      await teamService.removeMember(removingMember.id);
      toast.success("Member removed from workspace.");
      setMembers((prev) => prev.filter((m) => m.id !== removingMember.id));
      setRemovingMember(null);
      loadTeamData(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Container size="lg" className="space-y-4">
      {/* Header matching dashboard/page.tsx standard */}
      <PageHeader
        title="Team & Governance"
        description="Luxury brokerage sales roster, lead routing dispatch rules, and role-based access control."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" aria-hidden="true" />
              <span>{currentWorkspace?.name || "Spacia Luxury Hub"}</span>
            </div>

            <div className="flex items-center gap-1.5 h-8 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-2xs whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
              <span>Team: Active</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTeamData(true)}
              disabled={isRefreshing || isLoading}
              className="h-8 gap-1.5 text-xs text-stone-700 bg-white shadow-2xs whitespace-nowrap hover:bg-stone-50 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-stone-400 shrink-0 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span>Refresh</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              className="h-8 gap-1.5 text-xs bg-[#0d4a36] hover:bg-[#0a3a2b] text-white shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Member</span>
            </Button>
          </div>
        }
      />

      {/* 4 Prioritized KPI Metric Cards */}
      <TeamStatsStrip stats={stats} isLoading={isLoading} />

      {/* Team Roster Table with integrated header, search, and segmented filters */}
      <TeamMemberTable
        members={members}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onSelectAgent={(member) => setSelectedAgentMember(member)}
        onEditRole={(member) => setEditingRoleMember(member)}
        onToggleStatus={handleToggleStatus}
        onRemoveMember={(member) => setRemovingMember(member)}
      />

      {/* Role-Based Access Control Guide */}
      <RoleGuidePanel roles={roles} />

      {/* Modals & Drawers */}
      <InviteMemberModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onMemberInvited={handleMemberInvited}
      />

      <EditRoleModal
        member={editingRoleMember}
        open={!!editingRoleMember}
        onOpenChange={(open) => !open && setEditingRoleMember(null)}
        onRoleUpdated={handleRoleUpdated}
      />

      <AgentDetailDrawer
        member={selectedAgentMember}
        open={!!selectedAgentMember}
        onOpenChange={(open) => !open && setSelectedAgentMember(null)}
        onAgentUpdated={handleAgentUpdated}
      />

      <ConfirmDialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
        title="Remove Member from Workspace"
        description={`Are you sure you want to remove ${
          removingMember?.user.firstName || removingMember?.user.email
        } from this workspace? They will immediately lose access and their lead routing profile will be deactivated.`}
        confirmText="Remove Member"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmRemove}
        isLoading={isRemoving}
      />
    </Container>
  );
}
