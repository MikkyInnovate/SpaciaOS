import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Public } from "../../common/auth/public.decorator";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { CurrentTenant } from "../../common/tenant/tenant.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { CallsService } from "./calls.service";
import { InitiateCallDto } from "./dto/initiate-call.dto";
import { GetCallsQueryDto } from "./dto/get-calls-query.dto";

@Controller("calls")
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  /**
   * Initiates an outbound AI voice call to a lead.
   * Requires 'calls:trigger' permission.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions("calls:trigger")
  async initiateCall(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: InitiateCallDto
  ) {
    return this.callsService.initiateCall(tenant, dto);
  }

  /**
   * Lists calls for active workspace with pagination and filters.
   * Requires 'leads:read' permission.
   */
  @Get()
  @RequirePermissions("leads:read")
  async listCalls(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: GetCallsQueryDto
  ) {
    return this.callsService.listCalls(tenant, query);
  }

  /**
   * Retrieves single call detail cockpit payload.
   * Requires 'leads:read' permission.
   */
  @Get(":id")
  @RequirePermissions("leads:read")
  async getCallDetail(
    @CurrentTenant() tenant: TenantContext,
    @Param("id", new ParseUUIDPipe()) id: string
  ) {
    return this.callsService.getCallDetail(tenant, id);
  }

  /**
   * Universal Vapi Webhook Callback Intake Endpoint.
   * Public endpoint called by Vapi telephony cloud infrastructure.
   */
  @Post("webhook/vapi")
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleVapiWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: any
  ) {
    return this.callsService.handleWebhook(headers, body);
  }
}
