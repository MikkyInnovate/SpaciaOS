import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import {
  IAiTool,
  ToolDefinition,
  ToolExecutionContext,
  SourceVerification,
} from "../interfaces/ai-tool.interface";
import { PropertyAdapterService } from "../../properties/property-adapter.service";
import { PriceResult } from "../../properties/adapters/property-adapter.interface";

export interface GetPriceParams {
  propertyId: string;
  unitId?: string;
  paymentPlan?: string;
  workspaceId?: string;
  providerId?: string;
}

@Injectable()
export class GetPropertyPriceTool
  implements IAiTool<GetPriceParams, PriceResult>
{
  readonly name = "get_property_price";
  readonly description =
    "Retrieve verified pricing details, service charge breakdowns, and payment plan options for a property.";
  readonly requiredPermission = "properties:read";

  readonly definition: ToolDefinition = {
    name: "get_property_price",
    description:
      "Retrieve verified pricing details, service charge breakdowns, and payment plan options for a property.",
    parameters: {
      type: "object",
      properties: {
        propertyId: {
          type: "string",
          description: "Unique canonical UUID or integration ID of the property",
        },
        unitId: {
          type: "string",
          description: "Optional sub-unit identifier within a multi-unit property",
        },
        paymentPlan: {
          type: "string",
          description: "Optional payment structure name to calculate specific milestones",
        },
      },
      required: ["propertyId"],
    },
  };

  constructor(private readonly propertyAdapterService: PropertyAdapterService) {}

  validateParams(rawParams: unknown): GetPriceParams {
    if (typeof rawParams !== "object" || rawParams === null) {
      throw new BadRequestException("get_property_price parameters must be an object.");
    }
    const params = rawParams as Record<string, any>;

    if (!params.propertyId || typeof params.propertyId !== "string" || !params.propertyId.trim()) {
      throw new BadRequestException("propertyId is required and must be a non-empty string.");
    }

    return {
      propertyId: params.propertyId.trim(),
      unitId: typeof params.unitId === "string" ? params.unitId.trim() : undefined,
      paymentPlan: typeof params.paymentPlan === "string" ? params.paymentPlan.trim() : undefined,
      workspaceId: typeof params.workspaceId === "string" ? params.workspaceId.trim() : undefined,
      providerId: typeof params.providerId === "string" ? params.providerId.trim() : undefined,
    };
  }

  async execute(
    params: GetPriceParams,
    context: ToolExecutionContext
  ): Promise<{ data: PriceResult; sourceVerification: SourceVerification }> {
    // 1. Mandatory inside-the-tool workspace boundary check
    if (!context.workspaceId) {
      throw new UnauthorizedException("Tool execution requires an active workspace context.");
    }
    if (params.workspaceId && params.workspaceId !== context.workspaceId) {
      throw new UnauthorizedException(
        `Cross-workspace access denied: tool caller in workspace [${context.workspaceId}] cannot query pricing in workspace [${params.workspaceId}].`
      );
    }

    // 2. Delegate to PropertyAdapterService
    const priceResult = await this.propertyAdapterService.getPrice(
      context.workspaceId,
      {
        propertyId: params.propertyId,
        unitId: params.unitId,
        paymentPlan: params.paymentPlan,
      },
      params.providerId
    );

    // 3. Construct source verification
    const sourceVerification: SourceVerification = {
      source: priceResult.provider,
      providerId: priceResult.provider,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      confidence: "authoritative",
      provenanceDetails: `Verified commercial terms from provider [${priceResult.provider}]: Base = ${priceResult.formattedBasePrice}.`,
    };

    return { data: priceResult, sourceVerification };
  }
}
