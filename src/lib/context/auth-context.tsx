"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { UserProfile, AuthContextValue } from "@/types/auth";
import { siteConfig } from "@/lib/config/site";

const DEFAULT_USER: UserProfile = {
  id: "usr_premier_001",
  name: "Sales Operations",
  email: "sales@premier.co",
  role: "Sales Operations Lead",
  workspaceRole: "admin",
  currentWorkspaceId: siteConfig.defaultWorkspace.id,
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile | null>(DEFAULT_USER);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const signOut = React.useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setUser(null);
    setIsLoading(false);
    router.push("/");
  }, [router]);

  const updateProfile = React.useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      signOut,
      updateProfile,
    }),
    [user, isLoading, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
