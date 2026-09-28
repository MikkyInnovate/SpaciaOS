import { Controller, Get, Post, Body } from "@nestjs/common";
import { HealthService } from "./health.service";
import { TestValidationDto } from "./dto/test-validation.dto";

import { Public } from "../../common/auth/public.decorator";

@Controller("health")
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    const data = await this.healthService.check();
    return {
      message: "Pacia API operational",
      data,
    };
  }

  @Get("readiness")
  async getReadiness() {
    const data = await this.healthService.checkReadiness();
    return {
      message: "Pacia production readiness probe verified",
      data,
    };
  }

  @Post("test-validation")
  testValidation(@Body() dto: TestValidationDto) {
    return {
      message: "Validation passed successfully",
      data: dto,
    };
  }
}
