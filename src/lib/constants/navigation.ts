import type { NavSection } from "@/types/navigation";

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    label: "Sales Command",
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        iconName: "LayoutDashboard",
        isAvailable: true,
      },
      {
        title: "Leads",
        href: "/leads",
        iconName: "Users",
        isAvailable: true,
      },
      {
        title: "Calls",
        href: "/calls",
        iconName: "PhoneCall",
        isAvailable: true,
      },
      {
        title: "Appointments",
        href: "/appointments",
        iconName: "CalendarDays",
        isAvailable: true,
      },
      {
        title: "Analytics",
        href: "/analytics",
        iconName: "BarChart3",
        isAvailable: true,
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "AI Sales Agent",
        href: "/ai-agent",
        iconName: "Bot",
        isAvailable: true,
      },
      {
        title: "Integrations",
        href: "/integrations",
        iconName: "Plug",
        isAvailable: true,
      },
      {
        title: "Team",
        href: "/team",
        iconName: "UserCheck",
        isAvailable: true,
      },
      {
        title: "Settings",
        href: "/settings",
        iconName: "Settings",
        isAvailable: true,
      },
    ],
  },
];
