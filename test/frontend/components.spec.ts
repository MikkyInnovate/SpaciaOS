/**
 * PACIA FRONTEND COMPONENT TEST SUITE
 * 
 * Verifies core UI primitives, badges, gauges, domain presentation cards,
 * edge states, and inspection components.
 */

import React from "react";
import { describe, it, expect, render } from "./setup";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreIndicator, resolveScoreCategory } from "@/components/ui/score-indicator";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PropertyCard } from "@/features/properties/components/property-card";
import { MOCK_PROPERTIES } from "@/features/properties/data/mock-properties";
import { AvailabilitySelector } from "@/features/appointments/components/availability-selector";
import { NotificationMenu } from "@/components/layout/notification-menu";
import {
  notificationsService,
  formatTimeAgo,
} from "@/features/notifications/services/notifications-service";

export async function runComponentTests() {
  await describe("1. StatusBadge Primitive", async () => {
    await it("renders HOT badge with rose styling and correct label", async () => {
      const res = render(React.createElement(StatusBadge, { status: "HOT" }));
      expect(res.getByText("HOT")).toBeTruthy();
      expect(res.containsClass("bg-rose-50")).toBeTruthy();
      expect(res.containsClass("text-rose-700")).toBeTruthy();
    });

    await it("renders WARM badge with amber styling", async () => {
      const res = render(React.createElement(StatusBadge, { status: "WARM" }));
      expect(res.getByText("WARM")).toBeTruthy();
      expect(res.containsClass("bg-amber-50")).toBeTruthy();
      expect(res.containsClass("text-amber-800")).toBeTruthy();
    });

    await it("renders COLD badge with stone neutral styling", async () => {
      const res = render(React.createElement(StatusBadge, { status: "COLD" }));
      expect(res.getByText("COLD")).toBeTruthy();
      expect(res.containsClass("bg-stone-100")).toBeTruthy();
      expect(res.containsClass("text-stone-600")).toBeTruthy();
    });

    await it("renders lifecycle stages (Viewing Booked, Qualified, In Conversation)", async () => {
      const res1 = render(React.createElement(StatusBadge, { status: "Viewing Booked" }));
      expect(res1.getByText("Viewing Booked")).toBeTruthy();
      expect(res1.containsClass("bg-indigo-50")).toBeTruthy();

      const res2 = render(React.createElement(StatusBadge, { status: "Qualified" }));
      expect(res2.getByText("Qualified")).toBeTruthy();
      expect(res2.containsClass("bg-emerald-50")).toBeTruthy();

      const res3 = render(React.createElement(StatusBadge, { status: "In Conversation" }));
      expect(res3.getByText("In Conversation")).toBeTruthy();
      expect(res3.containsClass("bg-blue-50")).toBeTruthy();
    });

    await it("renders pulsating live dot when withDot=true and pulse=true", async () => {
      const res = render(React.createElement(StatusBadge, { status: "Live", withDot: true, pulse: true }));
      expect(res.containsClass("animate-pulse")).toBeTruthy();
    });
  });

  await describe("2. ScoreIndicator Primitive", async () => {
    await it("correctly resolves score categories based on thresholds", async () => {
      expect(resolveScoreCategory(95)).toBe("HOT");
      expect(resolveScoreCategory(80)).toBe("HOT");
      expect(resolveScoreCategory(79)).toBe("WARM");
      expect(resolveScoreCategory(60)).toBe("WARM");
      expect(resolveScoreCategory(59)).toBe("COLD");
      expect(resolveScoreCategory(0)).toBe("COLD");
    });

    await it("renders Pending state when score is null or undefined", async () => {
      const res = render(React.createElement(ScoreIndicator, { score: null }));
      expect(res.getByText("Pending")).toBeTruthy();
    });

    await it("renders compact badge variant with score and category label", async () => {
      const res = render(React.createElement(ScoreIndicator, { score: 92, variant: "badge" }));
      expect(res.getByText("92")).toBeTruthy();
      expect(res.getByText("HOT")).toBeTruthy();
      expect(res.containsClass("bg-rose-50")).toBeTruthy();
    });

    await it("renders gauge variant with proportional progress width", async () => {
      const res = render(React.createElement(ScoreIndicator, { score: 75, variant: "gauge" }));
      expect(res.getByText("75/100")).toBeTruthy();
      expect(res.getByText("WARM")).toBeTruthy();
      expect(res.html.includes("width:75%")).toBeTruthy();
    });

    await it("renders breakdown variant with 5-point BANT dimensions", async () => {
      const res = render(
        React.createElement(ScoreIndicator, {
          score: 90,
          variant: "breakdown",
        })
      );

      expect(res.getByText("Qualification Matrix")).toBeTruthy();
      expect(res.getByText("5-point underwriting breakdown")).toBeTruthy();
      expect(res.getByText("Budget Verification")).toBeTruthy();
      expect(res.getByText("Authority / Decision Maker")).toBeTruthy();
    });
  });

  await describe("3. EmptyState & ErrorState Edge Primitives", async () => {
    await it("renders EmptyState domain presets correctly", async () => {
      const res = render(
        React.createElement(EmptyState, {
          preset: "no-leads",
          title: "No Inbound Leads Found",
          description: "All incoming leads have been processed.",
        })
      );
      expect(res.getByText("No Inbound Leads Found")).toBeTruthy();
      expect(res.getByText("All incoming leads have been processed.")).toBeTruthy();
    });

    await it("renders ErrorState with recovery action and error code", async () => {
      const res = render(
        React.createElement(ErrorState, {
          title: "Failed to load leads",
          description: "Database connection failed",
          errorCode: "DB_TIMEOUT_504",
          onRetry: () => {},
        })
      );
      expect(res.getByText("Failed to load leads")).toBeTruthy();
      expect(res.getByText("Database connection failed")).toBeTruthy();
      expect(res.getByText("DB_TIMEOUT_504")).toBeTruthy();
      expect(res.getByText("Retry Request")).toBeTruthy();
    });
  });

  await describe("4. PropertyCard Real-Estate Presentation", async () => {
    const sampleProperty = MOCK_PROPERTIES[0];

    await it("renders property title, prime location, and formatted Naira valuation", async () => {
      const res = render(
        React.createElement(PropertyCard, {
          property: sampleProperty,
          declaredBudget: "₦950,000,000",
        })
      );

      expect(res.getByText(sampleProperty.title)).toBeTruthy();
      expect(res.getByText(sampleProperty.location)).toBeTruthy();
      expect(res.getByText(sampleProperty.formattedPrice)).toBeTruthy();
    });

    await it("renders bedroom, bathroom, and floor area chips", async () => {
      const res = render(React.createElement(PropertyCard, { property: sampleProperty }));
      expect(res.getByText(String(sampleProperty.bedrooms))).toBeTruthy();
      expect(res.getByText(String(sampleProperty.bathrooms))).toBeTruthy();
      expect(res.getByText(`${sampleProperty.squareMeters} m²`)).toBeTruthy();
    });

    await it("renders legal title verification badge (Governor's Consent / C of O)", async () => {
      const res = render(React.createElement(PropertyCard, { property: sampleProperty }));
      expect(res.getByText("Verified")).toBeTruthy();
      if (sampleProperty.verification.titleDeedType) {
        expect(res.getByText(sampleProperty.verification.titleDeedType)).toBeTruthy();
      }
    });

    await it("renders verified amenities features checklist", async () => {
      const res = render(React.createElement(PropertyCard, { property: sampleProperty }));
      for (const feat of sampleProperty.features.slice(0, 2)) {
        expect(res.getByText(feat)).toBeTruthy();
      }
    });
  });

  await describe("5. AvailabilitySelector Inspection Scheduling Primitive", async () => {
    await it("renders inspection windows header and Google Calendar sync badge", async () => {
      const res = render(
        React.createElement(AvailabilitySelector, {
          propertyId: "prop_banana_02",
          onSelectSlot: () => {},
        })
      );

      expect(res.getByText("Available Inspection Windows")).toBeTruthy();
      expect(res.getByText("Google Calendar Synced")).toBeTruthy();
    });
  });

  await describe("6. Responsive Notification Modal & Operational Alerts Center", async () => {
    await it("renders NotificationMenu trigger button with accessible ARIA attributes", async () => {
      const res = render(React.createElement(NotificationMenu));
      expect(res.hasAttribute("aria-label")).toBeTruthy();
      expect(res.hasAttribute("aria-haspopup", "dialog")).toBeTruthy();
      expect(res.hasAttribute("id", "notification-bell-trigger")).toBeTruthy();
    });

    await it("renders EmptyState with preset 'no-notifications' and accessible copy", async () => {
      const res = render(
        React.createElement(EmptyState, {
          preset: "no-notifications",
        })
      );
      expect(res.getByText("All Caught Up")).toBeTruthy();
      expect(res.getByText("No pending operational alerts or unread notifications in this workspace.")).toBeTruthy();
    });

    await it("formats relative time strings accurately", async () => {
      const justNow = formatTimeAgo(new Date().toISOString());
      expect(justNow).toBeDefined();

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatTimeAgo(tenMinutesAgo)).toContain("10m ago");

      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      expect(formatTimeAgo(twoHoursAgo)).toContain("2h ago");
    });

    await it("fetches notifications and supports optimistic mark as read", async () => {
      const initial = await notificationsService.getNotifications();
      expect(initial.notifications.length).toBeGreaterThan(0);
      expect(initial.total).toBeGreaterThan(0);

      const firstUnread = initial.notifications.find((n) => !n.isRead);
      if (firstUnread) {
        const markSuccess = await notificationsService.markAsRead(firstUnread.id);
        expect(markSuccess).toBe(true);

        const updated = await notificationsService.getNotifications();
        const found = updated.notifications.find((n) => n.id === firstUnread.id);
        expect(found?.isRead).toBe(true);
      }
    });

    await it("supports optimistic mark all as read across the fleet", async () => {
      const allReadSuccess = await notificationsService.markAllAsRead();
      expect(allReadSuccess).toBe(true);

      const count = notificationsService.getUnreadCount();
      expect(count).toBe(0);

      const after = await notificationsService.getNotifications({ isRead: false });
      expect(after.notifications.length).toBe(0);
    });
  });
}
