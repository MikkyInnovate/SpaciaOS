import {
  IsString,
  IsEmail,
  IsOptional,
  IsIn,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from "class-validator";

export class InviteMemberDto {
  @IsEmail({}, { message: "A valid email address is required" })
  email!: string;

  @IsString()
  @IsIn(["owner", "admin", "sales_manager", "sales_agent"], {
    message: "Role must be one of: owner, admin, sales_manager, sales_agent",
  })
  role!: "owner" | "admin" | "sales_manager" | "sales_agent";

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  roleTitle?: string;

  @IsOptional()
  @IsString()
  territory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  maxConcurrentLeads?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  routingWeight?: number;
}

export class UpdateMemberRoleDto {
  @IsString()
  @IsIn(["owner", "admin", "sales_manager", "sales_agent"], {
    message: "Role must be one of: owner, admin, sales_manager, sales_agent",
  })
  role!: "owner" | "admin" | "sales_manager" | "sales_agent";
}

export class UpdateMemberStatusDto {
  @IsString()
  @IsIn(["active", "suspended", "invited", "pending"], {
    message: "Status must be one of: active, suspended, invited, pending",
  })
  status!: "active" | "suspended" | "invited" | "pending";
}

export class UpdateAgentRoutingDto {
  @IsOptional()
  @IsString()
  territory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  routingWeight?: number;

  @IsOptional()
  @IsBoolean()
  isAvailableForRouting?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  maxConcurrentLeads?: number;

  @IsOptional()
  @IsString()
  @IsIn(["active", "busy", "offline"], {
    message: "Status must be one of: active, busy, offline",
  })
  status?: "active" | "busy" | "offline";
}

export class AcceptInvitationDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  clerkUserId?: string;
}

