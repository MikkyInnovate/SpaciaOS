"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils/cn";

export interface ResizablePanelGroupProps
  extends Omit<React.ComponentProps<typeof Group>, "orientation"> {
  direction?: "horizontal" | "vertical";
  orientation?: "horizontal" | "vertical";
}

const ResizablePanelGroup = ({
  className,
  direction,
  orientation,
  ...props
}: ResizablePanelGroupProps) => (
  <Group
    orientation={orientation ?? direction ?? "horizontal"}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const ResizablePanel = Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) => (
  <Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-stone-200 transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 hover:bg-stone-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-6 w-3.5 items-center justify-center rounded-xs border border-stone-200 bg-white shadow-2xs hover:bg-stone-50">
        <GripVertical className="h-3 w-3 text-stone-400" />
      </div>
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
