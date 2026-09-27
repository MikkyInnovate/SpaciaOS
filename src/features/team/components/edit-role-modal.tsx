"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { teamService } from "../services/team-service";
import type { TeamMember, WorkspaceRole } from "../types";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";

export interface EditRoleModalProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleUpdated: (updatedMember: TeamMember) => void;
}

export function EditRoleModal({
  member,
  open,
  onOpenChange,
  onRoleUpdated,
}: EditRoleModalProps) {
  const [selectedRole, setSelectedRole] = React.useState<WorkspaceRole>("sales_agent");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  if (!member) return null;

  const memberName =
    [member.user.firstName, member.user.lastName].filter(Boolean).join(" ") ||
    member.agent?.name ||
    member.invitedEmail ||
    member.user.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === member.role) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await teamService.updateRole(member.id, { role: selectedRole });
      toast.success(`Role for ${memberName} updated to ${selectedRole}.`);
      onRoleUpdated(updated);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update member role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border border-stone-200/80 bg-white shadow-xl rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header matching canonical SpaciaOS dialogs */}
          <DialogHeader className="p-5 pb-4 border-b border-stone-100 bg-[#fcfcfb] text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200/70 text-indigo-700 shadow-2xs shrink-0">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-sm font-semibold text-stone-900 tracking-tight">
                  Reassign Member Role
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Modify permissions and RBAC clearance for <strong className="text-stone-800">{memberName}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Form Content */}
          <div className="p-5 space-y-4">
            {member.role === "owner" && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-stone-900">Sole Owner Protection:</span>
                  <p className="mt-0.5 text-stone-600">
                    If this member is the only workspace owner, another member must be promoted to Owner first before reassigning this role.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Select Workspace Role
              </label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setSelectedRole(val as WorkspaceRole)}
              >
                <SelectTrigger className="h-8.5 text-xs bg-white border-stone-200 shadow-2xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_agent" className="text-xs">
                    Licensed Luxury Broker (Viewings & Lead Intake)
                  </SelectItem>
                  <SelectItem value="sales_manager" className="text-xs">
                    Sales Director / Manager (Pipeline Supervision & Objections)
                  </SelectItem>
                  <SelectItem value="admin" className="text-xs">
                    Operations Admin (Full Team & Settings Authority)
                  </SelectItem>
                  <SelectItem value="owner" className="text-xs">
                    Workspace Owner (Unrestricted Billing & Account Authority)
                  </SelectItem>
                  <SelectItem value="viewer" className="text-xs">
                    Auditor / Viewer (Read-only)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 hover:bg-stone-100 shadow-2xs cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 gap-1.5 bg-[#0d4a36] hover:bg-[#0a3a2b] px-3.5 text-xs font-medium text-white shadow-2xs transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Role...</span>
                </>
              ) : (
                <span>Confirm Role Change</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
