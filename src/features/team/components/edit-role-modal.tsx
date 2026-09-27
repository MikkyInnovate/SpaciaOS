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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-700">
            <Shield className="h-5 w-5" />
            <DialogTitle className="text-base font-serif font-bold text-stone-900">
              Reassign Member Role
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-stone-500">
            Modify workspace permissions and RBAC clearance for <strong className="text-stone-800">{memberName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {member.role === "owner" && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Sole Owner Protection Guardrail:</span>
                <p className="mt-0.5 text-amber-800">
                  If this member is the only workspace owner, ensure another member is promoted to Owner first before demoting.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">
              Select New Role
            </label>
            <Select
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as WorkspaceRole)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales_agent">Licensed Luxury Broker (Viewings & Lead Intake)</SelectItem>
                <SelectItem value="sales_manager">Sales Director / Manager (Pipeline Supervision & Objections)</SelectItem>
                <SelectItem value="admin">Operations Admin (Full Team & Settings Authority)</SelectItem>
                <SelectItem value="owner">Workspace Owner (Unrestricted Billing & Account Authority)</SelectItem>
                <SelectItem value="viewer">Auditor / Viewer (Read-only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-[#0d4a36] hover:bg-[#0a3a2b] text-white cursor-pointer gap-1.5"
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
