import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { Public } from "../../common/auth/public.decorator";
import { RateLimit } from "../../common/guards/rate-limit.decorator";
import { WaitlistService } from "./waitlist.service";
import { JoinWaitlistDto } from "./dto/join-waitlist.dto";
import { UpdateWaitlistProfileDto } from "./dto/update-waitlist-profile.dto";
import {
  WaitlistJoinResponseDto,
  WaitlistStatsResponseDto,
  WaitlistProfileResponseDto,
} from "./dto/waitlist-response.dto";

@Controller("waitlist")
@Public()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  /**
   * Submit email to join the waitlist with idempotent reservation & referral tracking.
   */
  @Post("join")
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    points: 10,
    duration: 60,
    keyPrefix: "waitlist_join",
    errorMessage: "Too many waitlist submissions from this IP. Please wait a minute.",
  })
  async joinWaitlist(
    @Body() dto: JoinWaitlistDto,
    @Req() req: Request
  ): Promise<WaitlistJoinResponseDto> {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const userAgent = (req.headers["user-agent"] as string) || undefined;

    return this.waitlistService.joinWaitlist(dto, clientIp, userAgent);
  }

  /**
   * Add the optional "about your team" details after joining (step 2 of the form).
   */
  @Patch("profile")
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    points: 10,
    duration: 60,
    keyPrefix: "waitlist_profile",
    errorMessage: "Too many updates from this IP. Please wait a minute.",
  })
  async updateProfile(@Body() dto: UpdateWaitlistProfileDto): Promise<WaitlistProfileResponseDto> {
    return this.waitlistService.updateProfile(dto);
  }

  /**
   * Public stats endpoint for live rolling odometer counter rendering.
   */
  @Get("stats")
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    points: 60,
    duration: 60,
    keyPrefix: "waitlist_stats",
  })
  async getStats(): Promise<WaitlistStatsResponseDto> {
    return this.waitlistService.getStats();
  }
}
