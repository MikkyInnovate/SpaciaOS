"use client";

import * as React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  icon,
  badge,
  children,
  footer,
  maxWidth = "lg",
  className,
}: DetailDrawerProps) {
  const maxWidthClass = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[maxWidth];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn("mx-auto w-full max-h-[90vh] overflow-hidden flex flex-col", maxWidthClass, className)}>
        {/* Header */}
        <DrawerHeader className="p-4 border-b border-stone-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && (
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#0d4a36] text-white shadow-2xs">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <DrawerTitle className="text-sm font-semibold text-stone-900 truncate">
                    {title}
                  </DrawerTitle>
                  {badge}
                </div>
                {description && (
                  <DrawerDescription className="text-xs text-stone-500 truncate mt-0.5">
                    {description}
                  </DrawerDescription>
                )}
              </div>
            </div>

            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-stone-400 hover:text-stone-700 shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <DrawerFooter className="p-3 border-t border-stone-100 bg-stone-50/50 flex flex-row items-center justify-end gap-2 flex-shrink-0">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
