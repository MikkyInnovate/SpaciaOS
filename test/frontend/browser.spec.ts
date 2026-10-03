/**
 * PACIA FRONTEND BROWSER & ROUTE TEST SUITE
 * 
 * Verifies route resolution, page export integrity, layout shell mounting,
 * accessible skip landmarks, navigation taxonomy soundness, and error/empty boundaries.
 */

import path from "path";
import React from "react";
import { describe, it, expect, render } from "./setup";
import { NAVIGATION_SECTIONS } from "@/lib/constants/navigation";

const SRC_DIR = path.resolve(__dirname, "../../src");

export async function runBrowserTests() {
  await describe("1. Route Resolution & Component Export Integrity", async () => {
    // Waitlist-only deployment (deploy/waitlist): the app routes are not part of this build
    const routesToTest = [
      { name: "/waitlist", file: "app/waitlist/page.tsx" },
      { name: "/privacy", file: "app/privacy/page.tsx" },
      { name: "404", file: "app/not-found.tsx" },
    ];

    for (const route of routesToTest) {
      await it(`resolves route ${route.name} and exports a valid React component`, async () => {
        const fullPath = path.join(SRC_DIR, route.file);
        const module = require(fullPath);
        const PageComponent = module.default;

        expect(PageComponent).toBeDefined();
        expect(typeof PageComponent).toBe("function");
      });
    }
  });

  await describe("2. Navigation Taxonomy & Routing Integrity", async () => {
    await it("ensures all navigation items define valid hrefs and icons", async () => {
      expect(NAVIGATION_SECTIONS.length).toBeGreaterThan(0);

      const allHrefs: string[] = [];
      for (const section of NAVIGATION_SECTIONS) {
        expect(section.label).toBeDefined();
        expect(section.items.length).toBeGreaterThan(0);

        for (const item of section.items) {
          expect(item.title).toBeDefined();
          expect(item.href).toBeDefined();
          expect(item.href.startsWith("/")).toBe(true);
          expect(item.iconName).toBeDefined();
          allHrefs.push(item.href);
        }
      }

      // Check key routes exist in navigation
      expect(allHrefs.includes("/dashboard")).toBe(true);
      expect(allHrefs.includes("/leads")).toBe(true);
      expect(allHrefs.includes("/calls")).toBe(true);
      expect(allHrefs.includes("/appointments")).toBe(true);
      expect(allHrefs.includes("/analytics")).toBe(true);
      expect(allHrefs.includes("/ai-agent")).toBe(true);
      expect(allHrefs.includes("/integrations")).toBe(true);
      expect(allHrefs.includes("/team")).toBe(true);
    });

    await it("verifies internal operations (/ops) is safely segregated from customer sidebar", async () => {
      const allSidebarHrefs = NAVIGATION_SECTIONS.flatMap((s) => s.items.map((i) => i.href));
      expect(allSidebarHrefs.includes("/ops")).toBe(false);
    });
  });

  await describe("3. Accessible Landmark & Layout Shell Checks", async () => {
    await it("verifies the accessibility skip-to-main-content landmark exists in Layout", async () => {
      // Mock Next navigation hooks
      try {
        const nextNav = require("next/navigation");
        nextNav.usePathname = () => "/dashboard";
        nextNav.useRouter = () => ({ push: () => {}, replace: () => {}, prefetch: () => {} });
      } catch {}

      // Mock workspace and auth contexts for isolated shell rendering
      const wsContext = require(path.join(SRC_DIR, "lib/context/workspace-context.tsx"));
      wsContext.useWorkspace = () => ({
        currentWorkspaceId: "ws_default",
        currentWorkspace: {
          id: "ws_default",
          name: "Dubai Palace Realty",
          slug: "dubai-palace",
          role: "admin",
        },
        workspaces: [],
        hasWorkspace: true,
        isLoading: false,
        switchWorkspace: async () => {},
      });

      const authContext = require(path.join(SRC_DIR, "lib/context/auth-context.tsx"));
      authContext.useAuth = () => ({
        user: { id: "user_test", name: "Test Closer", email: "closer@spacia.ai", role: "admin" },
        isSignedIn: true,
        isLoaded: true,
        signOut: async () => {},
      });

      const { AppShell } = require(path.join(SRC_DIR, "components/layout/app-shell.tsx"));
      expect(AppShell).toBeDefined();

      const res = render(
        React.createElement(
          AppShell,
          null,
          React.createElement("div", { id: "test-content" }, "App Content")
        )
      );

      // Verify #main-content landmark is present
      expect(res.html.includes('id="main-content"')).toBe(true);
      expect(res.getByText("Skip to main content")).toBe(true);
    });
  });
}
