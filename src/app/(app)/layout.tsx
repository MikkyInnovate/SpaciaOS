import { AuthProvider } from "@/lib/context/auth-context";
import { WorkspaceProvider } from "@/lib/context/workspace-context";
import { WorkspaceGuard } from "@/components/layout/workspace-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <WorkspaceGuard>{children}</WorkspaceGuard>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
