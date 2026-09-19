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
import { Loader2, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "success";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  isLoading: propIsLoading,
  icon,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = propIsLoading ?? internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Allow caller to catch or set error state
    } finally {
      setInternalLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          iconBg: "bg-red-50 border-red-200 text-red-600",
          button: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          iconBg: "bg-amber-50 border-amber-200 text-amber-600",
          button: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
          iconBg: "bg-emerald-50 border-emerald-200 text-emerald-600",
          button: "bg-[#0d4a36] hover:bg-[#093829] text-white",
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-stone-700" />,
          iconBg: "bg-stone-100 border-stone-200 text-stone-700",
          button: "bg-[#0d4a36] hover:bg-[#093829] text-white",
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 rounded-xl border border-stone-200 shadow-lg">
        <DialogHeader className="flex flex-row items-start gap-3 space-y-0 text-left">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-2xs mt-0.5",
              variantStyle.iconBg
            )}
          >
            {icon || variantStyle.icon}
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-sm font-semibold text-stone-900">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs text-stone-500 leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2 border-t border-stone-100 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs text-stone-700 bg-white hover:bg-stone-50 cursor-pointer"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={handleConfirm}
            className={cn("h-8 gap-1.5 text-xs shadow-2xs cursor-pointer", variantStyle.button)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
