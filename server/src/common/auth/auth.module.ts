import { Module, Global } from "@nestjs/common";
import { ClerkService } from "./clerk.service";
import { ClerkAuthGuard } from "./clerk-auth.guard";
import { WorkspaceMemberGuard } from "./workspace-member.guard";
import { PermissionsGuard } from "./permissions.guard";
import { AuthController } from "./auth.controller";

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    ClerkService,
    ClerkAuthGuard,
    WorkspaceMemberGuard,
    PermissionsGuard,
  ],
  exports: [
    ClerkService,
    ClerkAuthGuard,
    WorkspaceMemberGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
