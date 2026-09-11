"use client";

import * as React from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";
import type { UserProfile, AuthContextValue } from "@/types/auth";
import { apiClient } from "@/lib/api/client";

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useClerkAuth();
  const clerk = useClerk();

  const isLoading = !isUserLoaded || !isAuthLoaded;

  // Map Clerk user to Pacia UserProfile
  const user = React.useMemo<UserProfile | null>(() => {
    if (!isSignedIn || !clerkUser) return null;

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "";

    const name =
      clerkUser.fullName ||
      clerkUser.firstName ||
      clerkUser.username ||
      email.split("@")[0] ||
      "User";

    return {
      id: clerkUser.id,
      name,
      email,
      avatarUrl: clerkUser.imageUrl,
      role: "Authenticated Agent",
    };
  }, [isSignedIn, clerkUser]);

  // Synchronize Clerk session token with centralized apiClient
  React.useEffect(() => {
    let isMounted = true;

    async function syncToken() {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (isMounted) {
            apiClient.setAuthToken(token);
          }
        } catch {
          if (isMounted) {
            apiClient.setAuthToken(null);
          }
        }
      } else {
        apiClient.setAuthToken(null);
      }
    }

    syncToken();

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, getToken]);

  const signOut = React.useCallback(async () => {
    apiClient.setAuthToken(null);
    await clerk.signOut({ redirectUrl: "/sign-in" });
  }, [clerk]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(isSignedIn && user),
      isLoading,
      signOut,
    }),
    [user, isSignedIn, isLoading, signOut]
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
