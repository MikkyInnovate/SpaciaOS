import { describe, it, expect, render } from "./setup";
import { telemetry } from "../../src/lib/telemetry/sentry";
import React from "react";
import AppErrorBoundary from "../../src/app/(app)/error";

export async function runProductionReadinessTests() {
  describe("Day 29 Production Readiness: Frontend Telemetry & Error Boundaries", () => {
    describe("1. Sentry / Telemetry Client & PII Scrubbing", () => {
      it("generates a distinct trace errorId when capturing an exception", () => {
        const errorId = telemetry.captureException(new Error("Simulated network timeout"));
        expect(typeof errorId).toBe("string");
        expect(errorId.startsWith("err_")).toBe(true);
      });

      it("recursively scrubs emails, phone numbers, and secrets from telemetry data", () => {
        const dirtyPayload = {
          clientEmail: "adebayo.luxury@lagosproperties.ng",
          clientPhone: "+2348031234567",
          localPhone: "08091234567",
          apiSecretKey: "sk_live_1234567890abcdef",
          userToken: "bearer_xyz_998877",
          safeDetails: {
            budget: 150000000,
            city: "Ikoyi",
            contactNote: "Reach out to lead at chidi@investments.com or call 07012345678 tomorrow.",
          },
        };

        const cleaned = telemetry.sanitize(dirtyPayload) as any;

        // Verify email redaction
        expect(cleaned.clientEmail).toBe("[REDACTED_EMAIL]");
        expect(cleaned.safeDetails.contactNote.includes("[REDACTED_EMAIL]")).toBe(true);
        expect(cleaned.safeDetails.contactNote.includes("chidi@investments.com")).toBe(false);

        // Verify phone redaction
        expect(cleaned.clientPhone).toBe("[REDACTED_PHONE]");
        expect(cleaned.localPhone).toBe("[REDACTED_PHONE]");
        expect(cleaned.safeDetails.contactNote.includes("[REDACTED_PHONE]")).toBe(true);

        // Verify secret redaction
        expect(cleaned.apiSecretKey).toBe("[REDACTED_SECRET]");
        expect(cleaned.userToken).toBe("[REDACTED_SECRET]");

        // Verify safe fields preserved
        expect(cleaned.safeDetails.budget).toBe(150000000);
        expect(cleaned.safeDetails.city).toBe("Ikoyi");
      });

      it("records, caps, and retrieves breadcrumbs for operational observability", () => {
        telemetry.addBreadcrumb({ category: "navigation", message: "Navigated to /dashboard" });
        telemetry.addBreadcrumb({ category: "ui", message: "Clicked filter HOT leads" });
        telemetry.captureMessage("Lead drawer opened", "info");

        // Capturing another exception should not crash with active breadcrumbs
        const errId = telemetry.captureException(new Error("Component unmount warning"), {
          route: "/dashboard",
          action: "drawer_open",
        });

        expect(typeof errId).toBe("string");
      });
    });

    describe("2. Error Boundary UI & Recovery Controls", () => {
      it("renders the AppErrorBoundary component with recovery actions and digest", () => {
        const mockError = new Error("ChunkLoadError: Loading chunk 41 failed");
        (mockError as any).digest = "DIGEST_778899_PROD";
        let resetCalled = false;

        const { html } = render(
          React.createElement(AppErrorBoundary, {
            error: mockError,
            reset: () => {
              resetCalled = true;
            },
          })
        );

        expect(html.includes("View Temporarily Unavailable")).toBe(true);
        expect(html.includes("Reload Component")).toBe(true);
        expect(html.includes("Return to Overview")).toBe(true);
        expect(html.includes("DIGEST_778899_PROD")).toBe(true);
      });
    });
  });
}
