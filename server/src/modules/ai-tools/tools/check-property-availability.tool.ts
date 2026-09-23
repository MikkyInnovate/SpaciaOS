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
import { AvailabilityResult } from "../../properties/adapters/property-adapter.interface";

export interface CheckAvailabilityParams {
  propertyId: string;
  unitId?: string;
  targetDate?: string;
  workspaceId?: string;
  providerId?: string;
}

@Injectable()
export class CheckPropertyAvailabilityTool
  implements IAiTool<CheckAvailabilityParams, AvailabilityResult>
{
  readonly name = "check_property_availability";
  readonly description =
    "Check real-time availability status for a property or specific sub-unit to confirm whether it is Available, Under Offer, or Sold.";
  readonly requiredPermission = "properties:read";

  readonly definition: ToolDefinition = {
    name: "check_property_availability",
    description:
      "Check real-time availability status for a property or specific sub-unit to confirm whether it is Available, Under Offer, or Sold.",
    parameters: {
      type: "object",
      properties: {
        propertyId: {
          type: "string",
          description: "Unique canonical UUID or integration ID of the property",
        },
        unitId: {
          type: "string",
          description: "Optional sub-unit identifier if querying a specific multi-unit development unit",
        },
        targetDate: {
          type: "string",
          description: "Optional ISO date string for move-in / occupancy target",
        },
      },
      required: ["propertyId"],
    },
  };

  constructor(private readonly propertyAdapterService: PropertyAdapterService) {}

  validateParams(rawParams: unknown): CheckAvailabilityParams {
    if (typeof rawParams !== "object" || rawParams === null) {
      throw new BadRequestException("check_property_availability parameters must be an object.");
    }
    const params = rawParams as Record<string, any>;

    if (!params.propertyId || typeof params.propertyId !== "string" || !params.propertyId.trim()) {
      throw new BadRequestException("propertyId is required and must be a non-empty string.");
    }

    return {
      propertyId: params.propertyId.trim(),
      unitId: typeof params.unitId === "string" ? params.unitId.trim() : undefined,
      targetDate: typeof params.targetDate === "string" ? params.targetDate.trim() : undefined,
      workspaceId: typeof params.workspaceId === "string" ? params.workspaceId.trim() : undefined,
      providerId: typeof params.providerId === "string" ? params.providerId.trim() : undefined,
    };
  }

  async execute(
    params: CheckAvailabilityParams,
    context: ToolExecutionContext
  ): Promise<{ data: AvailabilityResult; sourceVerification: SourceVerification }> {
    // 1. Mandatory inside-the-tool workspace boundary check
    if (!context.workspaceId) {
      throw new UnauthorizedException("Tool execution requires an active workspace context.");
    }
    if (params.workspaceId && params.workspaceId !== context.workspaceId) {
      throw new UnauthorizedException(
        `Cross-workspace access denied: tool caller in workspace [${context.workspaceId}] cannot check availability in workspace [${params.workspaceId}].`
      );
    }

    // 2. Delegate to PropertyAdapterService
    const result = await this.propertyAdapterService.checkAvailability(
      context.workspaceId,
      {
        propertyId: params.propertyId,
        unitId: params.unitId,
        targetDate: params.targetDate,
      },
      params.providerId
    );

    // 3. Construct source verification
    const isKnown = result.status !== "Unknown";
    const sourceVerification: SourceVerification = {
      source: result.provider,
      providerId: result.provider,
      isVerified: isKnown,
      verifiedAt: result.checkedAt,
      confidence: isKnown ? "authoritative" : "unverified",
      provenanceDetails: `Real-time availability confirmed by provider [${result.provider}]: Status = ${result.status}.`,
    };

    return { data: result, sourceVerification };
  }
}
