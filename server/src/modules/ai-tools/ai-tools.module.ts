import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { PropertiesModule } from "../properties/properties.module";
import { AiToolsController } from "./ai-tools.controller";
import { AiToolExecutorService } from "./services/ai-tool-executor.service";
import { CompanyPolicyService } from "./services/company-policy.service";
import { SearchPropertiesTool } from "./tools/search-properties.tool";
import { GetPropertyTool } from "./tools/get-property.tool";
import { CheckPropertyAvailabilityTool } from "./tools/check-property-availability.tool";
import { GetPropertyPriceTool } from "./tools/get-property-price.tool";
import { GetCompanyPolicyTool } from "./tools/get-company-policy.tool";
import { GetAgentTool } from "./tools/get-agent.tool";

@Module({
  imports: [DatabaseModule, PropertiesModule],
  controllers: [AiToolsController],
  providers: [
    CompanyPolicyService,
    SearchPropertiesTool,
    GetPropertyTool,
    CheckPropertyAvailabilityTool,
    GetPropertyPriceTool,
    GetCompanyPolicyTool,
    GetAgentTool,
    AiToolExecutorService,
  ],
  exports: [
    AiToolExecutorService,
    CompanyPolicyService,
    SearchPropertiesTool,
    GetPropertyTool,
    CheckPropertyAvailabilityTool,
    GetPropertyPriceTool,
    GetCompanyPolicyTool,
    GetAgentTool,
  ],
})
export class AiToolsModule {}
