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
import {
  CompanyPolicyService,
  PolicyCategory,
  CompanyPolicyDossier,
} from "../services/company-policy.service";

export interface GetCompanyPolicyParams {
  category?: PolicyCategory;
  workspaceId?: string;
}

const VALID_CATEGORIES: PolicyCategory[] = [
  "commission",
  "inspection",
  "escrow_payment",
  "title_verification",
  "dnc_quiet_hours",
  "ai_escalation",
  "all",
];

@Injectable()
export class GetCompanyPolicyTool
  implements IAiTool<GetCompanyPolicyParams, CompanyPolicyDossier>
{
  readonly name = "get_company_policy";
  readonly description =
    "Retrieve authoritative brokerage policies on agency commission, viewing protocols, escrow & AML payment rules, title verification, DNC quiet hours, and AI escalation limits.";
  readonly requiredPermission = "properties:read"; // or baseline brokerage read

  readonly definition: ToolDefinition = {
    name: "get_company_policy",
    description:
      "Retrieve authoritative brokerage policies on agency commission, viewing protocols, escrow & AML payment rules, title verification, DNC quiet hours, and AI escalation limits.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: [
            "commission",
            "inspection",
            "escrow_payment",
            "title_verification",
            "dnc_quiet_hours",
            "ai_escalation",
            "all",
          ],
          description:
            "Specific policy category to query. Omit or pass 'all' for full operational guidelines.",
        },
      },
    },
  };

  constructor(private readonly policyService: CompanyPolicyService) {}

  validateParams(rawParams: unknown): GetCompanyPolicyParams {
    if (rawParams === undefined || rawParams === null) {
      return { category: "all" };
    }
    if (typeof rawParams !== "object") {
      throw new BadRequestException("get_company_policy parameters must be an object.");
    }
    const params = rawParams as Record<string, any>;

    if (params.category !== undefined && !VALID_CATEGORIES.includes(params.category)) {
      throw new BadRequestException(
        `Invalid policy category [${params.category}]. Allowed categories: ${VALID_CATEGORIES.join(", ")}`
      );
    }

    return {
      category: params.category || "all",
      workspaceId: typeof params.workspaceId === "string" ? params.workspaceId.trim() : undefined,
    };
  }

  async execute(
    params: GetCompanyPolicyParams,
    context: ToolExecutionContext
  ): Promise<{ data: CompanyPolicyDossier; sourceVerification: SourceVerification }> {
    // 1. Mandatory inside-the-tool workspace boundary check
    if (!context.workspaceId) {
      throw new UnauthorizedException("Tool execution requires an active workspace context.");
    }
    if (params.workspaceId && params.workspaceId !== context.workspaceId) {
      throw new UnauthorizedException(
        `Cross-workspace access denied: tool caller in workspace [${context.workspaceId}] cannot query policies for workspace [${params.workspaceId}].`
      );
    }

    // 2. Query policy service
    const { dossier, sourceVerification } = await this.policyService.getPolicy(
      context.workspaceId,
      params.category
    );

    return { data: dossier, sourceVerification };
  }
}
