import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/context/auth-context";
import { WorkspaceProvider } from "@/lib/context/workspace-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
