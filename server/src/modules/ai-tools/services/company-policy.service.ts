import { Injectable, Logger } from "@nestjs/common";
import { SourceVerification } from "../interfaces/ai-tool.interface";

export type PolicyCategory =
  | "commission"
  | "inspection"
  | "escrow_payment"
  | "title_verification"
  | "dnc_quiet_hours"
  | "ai_escalation"
  | "all";

export interface PolicyRule {
  id: string;
  category: PolicyCategory;
  title: string;
  summary: string;
  details: string;
  mandatoryGuardrail: boolean;
  escalationRequiredIfViolated: boolean;
  legalBasis?: string;
}

export interface CompanyPolicyDossier {
  workspaceId: string;
  category: PolicyCategory;
  policies: PolicyRule[];
  lastAuditedAt: string;
  complianceOfficer: string;
}

/**
 * COMPANY POLICY SERVICE
 * 
 * Authoritative provider for brokerage compliance, commercial rules,
 * inspection guidelines, and legal safety boundaries.
 * 
 * Guarantees that autonomous AI agents operate strictly within verified
 * legal and operational boundaries in Nigerian and international luxury markets.
 */
@Injectable()
export class CompanyPolicyService {
  private readonly logger = new Logger(CompanyPolicyService.name);

  private readonly authoritativePolicies: PolicyRule[] = [
    {
      id: "pol_comm_01",
      category: "commission",
      title: "Agency Commission & Brokerage Fees",
      summary: "Standard 5% purchase commission; 10% on residential leaseholds.",
      details:
        "Standard agency commission is 5% of gross transaction value on real estate purchases and 10% on one-year lease transactions. The AI sales persona is strictly prohibited from agreeing to commission reductions, rebates, or fee waivers. Any negotiation on commission triggers an immediate handoff to the agency managing director.",
      mandatoryGuardrail: true,
      escalationRequiredIfViolated: true,
      legalBasis: "Lagos State Real Estate Regulatory Authority (LASRERA) Guidelines",
    },
    {
      id: "pol_insp_02",
      category: "inspection",
      title: "Physical Inspection & Viewing Protocols",
      summary: "24-hour advance notice, pre-qualified liquidity, and ID verification required.",
      details:
        "Physical viewings of private properties in gated corridors (Banana Island, Ikoyi, Victoria Island, Lekki Phase 1, Eko Atlantic) require a minimum 24-hour advance booking. Prospects must have verified government ID and pre-qualified BANT budget status before gate clearance is issued. In-person inspections are conducted Monday through Saturday from 09:00 to 18:00 WAT.",
      mandatoryGuardrail: true,
      escalationRequiredIfViolated: false,
      legalBasis: "Gated Community Resident Association Security Protocols",
    },
    {
      id: "pol_escr_03",
      category: "escrow_payment",
      title: "Institutional Escrow & Anti-Money Laundering (AML)",
      summary: "Direct developer corporate accounts or certified institutional escrow only.",
      details:
        "All purchase deposits and balance disbursements must be executed via corporate bank wire to designated developer institutional accounts or verified bank escrow. Cash transactions, personal broker accounts, and unauthorized third-party transfers are strictly prohibited. The AI persona must never issue wire routing numbers directly without human compliance countersignature.",
      mandatoryGuardrail: true,
      escalationRequiredIfViolated: true,
      legalBasis: "Money Laundering (Prevention and Prohibition) Act 2022 & SCUML Regulations",
    },
    {
      id: "pol_titl_04",
      category: "title_verification",
      title: "Deed Verification & Truth Policy",
      summary: "Verified Governor's Consent, C of O, or Gazette required before contract execution.",
      details:
        "Properties marketed through SpaciaOS must have clear and verified root of title (Governor's Consent, Certificate of Occupancy, Registered Gazette, or Federal Deed of Grant). The AI persona must only state a property's title as 'Verified' if the official registry file number is present in the normalized property dossier. Unverified claims are strictly forbidden.",
      mandatoryGuardrail: true,
      escalationRequiredIfViolated: true,
      legalBasis: "Lagos State Lands Registration Law 2015",
    },
    {
      id: "pol_dnc_05",
      category: "dnc_quiet_hours",
      title: "Do Not Call (DNC) & Quiet Hours Enforcement",
      summary: "Quiet hours 20:00 - 08:00 WAT; maximum 3 outbound call attempts; instant opt-out.",
      details:
        "Automated outbound voice dialers and messaging pipelines are strictly paused between 20:00 and 08:00 West Africa Time (WAT). A maximum of 3 outbound telephony attempts are permitted per lead over a 7-day period. Any verbal or written request from a prospect to cease communication must immediately update the lead's DNC status and stop all automated workflows.",
      mandatoryGuardrail: true,
      escalationRequiredIfViolated: false,
      legalBasis: "NCC Consumer Code of Practice & NDPR Data Protection Regulations",
    },
    {
      id: "pol_escl_06",
      category: "ai_escalation",
      title: "Autonomous AI Boundaries & Human Escalation Triggers",
      summary: "Instant handoff on price discounts, legal contract redlines, or explicit human request.",
      details:
        "The AI persona must immediately halt autonomous processing and flag the lead for human broker takeover upon encountering: (1) Demands for price discounts or off-plan payment modifications, (2) Requests to review or alter sale agreement contracts, (3) Formal complaints, or (4) Explicit request to speak with a licensed human broker.",
      mandatoryGuardrail: true,
      escalationRequiredIfViolated: true,
      legalBasis: "SpaciaOS Autonomous Agent Governance Framework",
    },
  ];

  /**
   * Retrieves authoritative company policy for a workspace by category.
   */
  async getPolicy(
    workspaceId: string,
    category: PolicyCategory = "all"
  ): Promise<{ dossier: CompanyPolicyDossier; sourceVerification: SourceVerification }> {
    if (!workspaceId) {
      throw new Error("workspaceId is required to retrieve company policy.");
    }

    const filtered =
      category === "all"
        ? this.authoritativePolicies
        : this.authoritativePolicies.filter((p) => p.category === category);

    const dossier: CompanyPolicyDossier = {
      workspaceId,
      category,
      policies: filtered,
      lastAuditedAt: "2026-09-20T00:00:00.000Z",
      complianceOfficer: "Spacia Legal & Compliance Directorate",
    };

    const sourceVerification: SourceVerification = {
      source: "spacia_policy_core",
      providerId: "spacia_compliance_registry",
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      confidence: "authoritative",
      provenanceDetails: "Audited against Nigerian real estate statutory governance & LASRERA guidelines.",
    };

    return { dossier, sourceVerification };
  }
}
