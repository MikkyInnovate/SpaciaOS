"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  UserPlus,
  RefreshCw,
  Search,
  Users,
  Shield,
  Filter,
} from "lucide-react";

export default function TeamPage() {
  const { currentWorkspace } = useWorkspace();

  const [stats, setStats] = React.useState<TeamStats | null>(null);
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [roles, setRoles] = React.useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

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

  // Filter members
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
        (roleFilter === "brokers" && (member.role === "sales_agent" || member.role === "sales_manager")) ||
        member.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

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
    <Container size="lg" className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Team & Governance"
        description={`Manage luxury brokers, operations admins, role permissions, and automated lead routing rules for ${
          currentWorkspace?.name || "Spacia Luxury Real Estate"
        }.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTeamData(true)}
              disabled={isRefreshing || isLoading}
              className="text-xs h-8 cursor-pointer bg-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 text-stone-500 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              className="text-xs h-8 bg-[#0d4a36] hover:bg-[#0a3a2b] text-white cursor-pointer gap-1.5 shadow-2xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Member</span>
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <TeamStatsStrip stats={stats} isLoading={isLoading} />

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-border shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <Input
              placeholder="Search by name, email, or territory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8.5 bg-stone-50/50"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50/80 p-0.5">
            {[
              { id: "all", label: "All Members" },
              { id: "brokers", label: "Luxury Brokers" },
              { id: "admin", label: "Admins" },
              { id: "owner", label: "Owners" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  roleFilter === tab.id
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50/80 p-0.5">
            {[
              { id: "all", label: "All States" },
              { id: "active", label: "Active" },
              { id: "suspended", label: "Suspended" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Roster Table */}
      <TeamMemberTable
        members={filteredMembers}
        isLoading={isLoading}
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
