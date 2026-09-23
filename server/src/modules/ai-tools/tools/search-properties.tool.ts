import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import {
  IAiTool,
  ToolDefinition,
  ToolExecutionContext,
  SourceVerification,
} from "../interfaces/ai-tool.interface";
import { PropertyAdapterService } from "../../properties/property-adapter.service";
import {
  PropertySearchParams,
  PropertySearchResult,
} from "../../properties/adapters/property-adapter.interface";

export interface SearchPropertiesParams {
  query?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  city?: string;
  state?: string;
  availability?: "Available" | "Under Offer" | "Sold" | "Reserved" | "ALL";
  features?: string[];
  page?: number;
  limit?: number;
  workspaceId?: string; // If passed by LLM, must match context
  providerId?: string;
}

@Injectable()
export class SearchPropertiesTool
  implements IAiTool<SearchPropertiesParams, PropertySearchResult>
{
  readonly name = "search_properties";
  readonly description =
    "Search available luxury properties in the workspace portfolio by keywords, location, property type, price range, and bedrooms.";
  readonly requiredPermission = "properties:read";

  readonly definition: ToolDefinition = {
    name: "search_properties",
    description:
      "Search available luxury properties in the workspace portfolio by keywords, location, property type, price range, and bedrooms.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keywords to search across title, address, estate name, or amenities (e.g. 'Banana Island pool')",
        },
        propertyType: {
          type: "string",
          description: "Type of property (e.g. 'Penthouse', 'Duplex', 'Villa', 'Terrace', 'Mansion')",
        },
        minPrice: {
          type: "number",
          description: "Minimum price in Naira (e.g. 100000000 for ₦100M)",
          minimum: 0,
        },
        maxPrice: {
          type: "number",
          description: "Maximum price in Naira (e.g. 850000000 for ₦850M)",
          minimum: 0,
        },
        minBedrooms: {
          type: "integer",
          description: "Minimum number of bedrooms required",
          minimum: 1,
        },
        city: {
          type: "string",
          description: "City or major corridor (e.g. 'Ikoyi', 'Victoria Island', 'Lekki')",
        },
        availability: {
          type: "string",
          enum: ["Available", "Under Offer", "Sold", "Reserved", "ALL"],
          description: "Availability status filter. Defaults to 'Available'.",
        },
        limit: {
          type: "integer",
          description: "Maximum results to return (1-20)",
          minimum: 1,
          maximum: 20,
        },
      },
    },
  };

  constructor(private readonly propertyAdapterService: PropertyAdapterService) {}

  validateParams(rawParams: unknown): SearchPropertiesParams {
    if (typeof rawParams !== "object" || rawParams === null) {
      throw new BadRequestException("search_properties parameters must be an object.");
    }
    const params = rawParams as Record<string, any>;

    if (params.minPrice !== undefined && (typeof params.minPrice !== "number" || params.minPrice < 0)) {
      throw new BadRequestException("minPrice must be a non-negative number.");
    }
    if (params.maxPrice !== undefined && (typeof params.maxPrice !== "number" || params.maxPrice < 0)) {
      throw new BadRequestException("maxPrice must be a non-negative number.");
    }
    if (
      params.minPrice !== undefined &&
      params.maxPrice !== undefined &&
      params.minPrice > params.maxPrice
    ) {
      throw new BadRequestException("minPrice cannot be greater than maxPrice.");
    }
    if (params.limit !== undefined && (typeof params.limit !== "number" || params.limit < 1 || params.limit > 50)) {
      throw new BadRequestException("limit must be between 1 and 50.");
    }

    return {
      query: typeof params.query === "string" ? params.query.trim() : undefined,
      propertyType: typeof params.propertyType === "string" ? params.propertyType.trim() : undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      minBedrooms: typeof params.minBedrooms === "number" ? Math.floor(params.minBedrooms) : undefined,
      maxBedrooms: typeof params.maxBedrooms === "number" ? Math.floor(params.maxBedrooms) : undefined,
      city: typeof params.city === "string" ? params.city.trim() : undefined,
      state: typeof params.state === "string" ? params.state.trim() : undefined,
      availability: params.availability,
      features: Array.isArray(params.features) ? params.features : undefined,
      page: typeof params.page === "number" ? Math.max(1, params.page) : 1,
      limit: typeof params.limit === "number" ? Math.min(50, Math.max(1, params.limit)) : 10,
      workspaceId: typeof params.workspaceId === "string" ? params.workspaceId.trim() : undefined,
      providerId: typeof params.providerId === "string" ? params.providerId.trim() : undefined,
    };
  }

  async execute(
    params: SearchPropertiesParams,
    context: ToolExecutionContext
  ): Promise<{ data: PropertySearchResult; sourceVerification: SourceVerification }> {
    // 1. Mandatory inside-the-tool workspace boundary check
    if (!context.workspaceId) {
      throw new UnauthorizedException("Tool execution requires an active workspace context.");
    }
    if (params.workspaceId && params.workspaceId !== context.workspaceId) {
      throw new UnauthorizedException(
        `Cross-workspace access denied: tool caller in workspace [${context.workspaceId}] cannot query workspace [${params.workspaceId}].`
      );
    }

    // 2. Delegate to PropertyAdapterService with verified workspaceId
    const searchParams: PropertySearchParams = {
      query: params.query,
      propertyType: params.propertyType,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      minBedrooms: params.minBedrooms,
      maxBedrooms: params.maxBedrooms,
      city: params.city,
      state: params.state,
      availability: params.availability || "Available",
      features: params.features,
      page: params.page,
      limit: params.limit,
    };

    const results = await this.propertyAdapterService.searchProperties(
      context.workspaceId,
      searchParams,
      params.providerId
    );

    // 3. Construct source verification
    const sourceVerification: SourceVerification = {
      source: results.provider,
      providerId: results.provider,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      confidence: results.provider === "spacia_native" ? "authoritative" : "provisional",
      provenanceDetails: `Retrieved ${results.items.length} properties via provider [${results.provider}] for workspace [${context.workspaceId}].`,
    };

    return { data: results, sourceVerification };
  }
}
