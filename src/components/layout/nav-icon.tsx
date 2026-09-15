import * as React from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  PhoneCall,
  CalendarDays,
  BarChart3,
  Bot,
  Plug,
  UserCheck,
  Settings,
  Layers,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  MessageSquareText,
  PhoneCall,
  CalendarDays,
  BarChart3,
  Bot,
  Plug,
  UserCheck,
  Settings,
  Layers,
};

export interface NavIconProps {
  name: string;
  className?: string;
}

export function NavIcon({ name, className }: NavIconProps) {
  const Icon = ICON_MAP[name] || HelpCircle;
  return <Icon className={className} aria-hidden="true" />;
}
