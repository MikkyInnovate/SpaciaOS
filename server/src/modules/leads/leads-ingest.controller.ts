import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response, Request } from "express";
import { LeadsIngestService } from "./leads-ingest.service";
import { LeadIngestDto } from "./dto/lead-ingest.dto";
import { Public } from "../../common/auth/public.decorator";
import { TenantContext } from "../../common/tenant/tenant-context.interface";

@Controller("leads")
export class LeadsIngestController {
  constructor(private readonly leadsIngestService: LeadsIngestService) {}

  /**
   * Universal Lead Intake Endpoint:
   * Accepts inbound inquiries from public website landing pages, portal webhooks,
   * or authenticated CRM users.
   */
  @Post("ingest")
  @Public()
  async ingestLead(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: LeadIngestDto,
    @Req() req: Request & { tenantContext?: TenantContext },
    @Res({ passthrough: true }) res: Response
  ) {
    const idempotencyKey = (
      (headers["idempotency-key"] as string) ||
      (headers["x-idempotency-key"] as string)
    )?.trim();

    const tenantContext: TenantContext | undefined = req.tenantContext;

    const result = await this.leadsIngestService.ingestLead(
      headers,
      dto,
      tenantContext,
      idempotencyKey
    );

    // Set header if this response is a cached idempotent replay
    if (result.isReplay) {
      res.setHeader("X-Idempotent-Replay", "true");
    }

    res.status(result.statusCode);

    return {
      message: result.responseBody.message,
      data: result.responseBody,
    };
  }
}
