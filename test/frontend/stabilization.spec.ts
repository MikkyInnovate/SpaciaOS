/**
 * PACIA DAY 28 FRONTEND STABILIZATION TEST SUITE
 * 
 * Validates resilience and edge-case handling across frontend primitives:
 * 1. ScoreIndicator: Case-insensitive categories, score clamping, defensive fallbacks
 * 2. StatusBadge: Snake_case, hyphen, uppercase, lowercase, and telephony outcomes
 * 3. CommandSearch: Safe item indexing, score normalization, zero runtime exceptions
 * 4. Error & Edge States: Graceful recovery and resilient fallbacks
 */

import React from "react";
import { describe, it, expect, render } from "./setup";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreIndicator, resolveScoreCategory } from "@/components/ui/score-indicator";

export async function runStabilizationTests() {
  await describe("5. Day 28 Stabilization: ScoreIndicator Resilience", async () => {
    await it("handles lowercase and mixed-case categories without runtime TypeError", async () => {
      // Previously, lowercase "hot" or "warm" caused CATEGORY_STYLES[category] to be undefined
      const resHot = render(React.createElement(ScoreIndicator, { score: 85, category: "hot" as any }));
      expect(resHot.getByText("85")).toBeTruthy();
      expect(resHot.containsClass("bg-rose-50")).toBeTruthy();

      const resWarm = render(React.createElement(ScoreIndicator, { score: 65, category: "warm" as any }));
      expect(resWarm.getByText("65")).toBeTruthy();
      expect(resWarm.containsClass("bg-amber-50")).toBeTruthy();

      const resCold = render(React.createElement(ScoreIndicator, { score: 30, category: "cold" as any }));
      expect(resCold.getByText("30")).toBeTruthy();
      expect(resCold.containsClass("bg-stone-100")).toBeTruthy();
    });

    await it("safely clamps negative and out-of-bound scores [0 - 100]", async () => {
      const resLow = render(React.createElement(ScoreIndicator, { score: -15 }));
      expect(resLow.getByText("0")).toBeTruthy();

      const resHigh = render(React.createElement(ScoreIndicator, { score: 150 }));
      expect(resHigh.getByText("100")).toBeTruthy();
    });

    await it("recovers gracefully when an invalid category is supplied", async () => {
      // Invalid category should gracefully fall back to score calculation
      const res = render(React.createElement(ScoreIndicator, { score: 92, category: "INVALID_CAT" as any }));
      expect(res.getByText("92")).toBeTruthy();
      expect(res.containsClass("bg-rose-50")).toBeTruthy();
    });

    await it("renders 'Pending' badge cleanly when score is null or undefined", async () => {
      const resNull = render(React.createElement(ScoreIndicator, { score: null }));
      expect(resNull.getByText("Pending")).toBeTruthy();

      const resUndefined = render(React.createElement(ScoreIndicator, { score: undefined }));
      expect(resUndefined.getByText("Pending")).toBeTruthy();
    });
  });

  await describe("6. Day 28 Stabilization: StatusBadge Domain Normalization", async () => {
    await it("resolves snake_case telephony and booking outcomes to proper luxury styles", async () => {
      // Telephony outcomes from Vapi webhook
      const res1 = render(React.createElement(StatusBadge, { status: "viewing_booked" }));
      expect(res1.containsClass("bg-indigo-50")).toBeTruthy();

      const res2 = render(React.createElement(StatusBadge, { status: "in_conversation" }));
      expect(res2.containsClass("bg-blue-50")).toBeTruthy();

      const res3 = render(React.createElement(StatusBadge, { status: "escalated_takeover" }));
      expect(res3.containsClass("bg-rose-50")).toBeTruthy();

      const res4 = render(React.createElement(StatusBadge, { status: "callback_requested" }));
      expect(res4.containsClass("bg-amber-50")).toBeTruthy();

      const res5 = render(React.createElement(StatusBadge, { status: "voicemail" }));
      expect(res5.containsClass("bg-stone-50")).toBeTruthy();

      const res6 = render(React.createElement(StatusBadge, { status: "human_managed" }));
      expect(res6.containsClass("bg-sky-50")).toBeTruthy();

      const res7 = render(React.createElement(StatusBadge, { status: "no_show" }));
      expect(res7.containsClass("bg-amber-50")).toBeTruthy();
    });

    await it("resolves mixed-casing and leading/trailing whitespace cleanly", async () => {
      const resHot = render(React.createElement(StatusBadge, { status: "  hOt  " }));
      expect(resHot.containsClass("bg-rose-50")).toBeTruthy();

      const resQual = render(React.createElement(StatusBadge, { status: "QUALIFIED" }));
      expect(resQual.containsClass("bg-emerald-50")).toBeTruthy();
    });
  });
}
