import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  IAiTool,
  ToolDefinition,
  ToolExecutionContext,
  SourceVerification,
} from "../interfaces/ai-tool.interface";
import { PropertyAdapterService } from "../../properties/property-adapter.service";
import { NormalizedProperty } from "../../properties/adapters/property-adapter.interface";

export interface GetPropertyParams {
  propertyId: string;
  workspaceId?: string;
  providerId?: string;
}

@Injectable()
export class GetPropertyTool
  implements IAiTool<GetPropertyParams, NormalizedProperty>
{
  readonly name = "get_property";
  readonly description =
    "Retrieve the full verified dossier of a specific property by ID, including title deed verification, square meters, amenities, and commercial terms.";
  readonly requiredPermission = "properties:read";

  readonly definition: ToolDefinition = {
    name: "get_property",
    description:
      "Retrieve the full verified dossier of a specific property by ID, including title deed verification, square meters, amenities, and commercial terms.",
    parameters: {
      type: "object",
      properties: {
        propertyId: {
          type: "string",
          description: "Unique canonical UUID or integration ID of the property",
        },
      },
      required: ["propertyId"],
    },
  };

  constructor(private readonly propertyAdapterService: PropertyAdapterService) {}

  validateParams(rawParams: unknown): GetPropertyParams {
    if (typeof rawParams !== "object" || rawParams === null) {
      throw new BadRequestException("get_property parameters must be an object.");
    }
    const params = rawParams as Record<string, any>;

    if (!params.propertyId || typeof params.propertyId !== "string" || !params.propertyId.trim()) {
      throw new BadRequestException("propertyId is required and must be a non-empty string.");
    }

    return {
      propertyId: params.propertyId.trim(),
      workspaceId: typeof params.workspaceId === "string" ? params.workspaceId.trim() : undefined,
      providerId: typeof params.providerId === "string" ? params.providerId.trim() : undefined,
    };
  }

  async execute(
    params: GetPropertyParams,
    context: ToolExecutionContext
  ): Promise<{ data: NormalizedProperty; sourceVerification: SourceVerification }> {
    // 1. Mandatory inside-the-tool workspace boundary check
    if (!context.workspaceId) {
      throw new UnauthorizedException("Tool execution requires an active workspace context.");
    }
    if (params.workspaceId && params.workspaceId !== context.workspaceId) {
      throw new UnauthorizedException(
        `Cross-workspace access denied: tool caller in workspace [${context.workspaceId}] cannot query property in workspace [${params.workspaceId}].`
      );
    }

    // 2. Fetch via PropertyAdapterService
    const property = await this.propertyAdapterService.getProperty(
      context.workspaceId,
      params.propertyId,
      params.providerId
    );

    if (!property) {
      throw new NotFoundException(
        `Property [${params.propertyId}] not found in workspace [${context.workspaceId}].`
      );
    }

    // 3. Source verification and title deed authenticity
    const isDeedVerified = property.verification.status === "Verified";
    const sourceVerification: SourceVerification = {
      source: property.source,
      providerId: property.source,
      isVerified: isDeedVerified,
      verifiedAt: property.verification.verifiedAt || property.lastSyncedAt || new Date().toISOString(),
      confidence: isDeedVerified ? "authoritative" : "provisional",
      provenanceDetails: property.verification.titleDeedType
        ? `Title: ${property.verification.titleDeedType}${property.verification.registryNumber ? ` (Reg: ${property.verification.registryNumber})` : ""}`
        : "Direct inventory lookup from integration provider.",
    };

    return { data: property, sourceVerification };
  }
}
