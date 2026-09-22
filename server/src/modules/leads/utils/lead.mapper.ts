import {
  LeadRecord,
  LeadEventRecord,
  LeadScoreRecord,
} from "../../../database/schema/leads.schema";
import { PropertyRecord } from "../../../database/schema/properties.schema";
import { AgentRecord } from "../../../database/schema/agents.schema";
import { QualificationResultRecord } from "../../../database/schema/qualifications.schema";
import {
  LeadSummaryDto,
  LeadDetailDto,
  LeadActivityDto,
} from "../dto/lead-response.dto";

export function toLeadSummaryDto(
  lead: LeadRecord,
  property?: PropertyRecord | null,
  agent?: AgentRecord | null
): LeadSummaryDto {
  const meta = (lead.metadata || {}) as Record<string, any>;

  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || "",
    propertyTitle:
      property?.title ||
      lead.locationPreference ||
      meta.propertyTitle ||
      "Luxury Residential Inquiry",
    location:
      property?.location ||
      lead.locationPreference ||
      meta.location ||
      "Lagos, Nigeria",
    budget: lead.budget || meta.budget || "₦0",
    score: lead.score,
    scoreCategory: lead.scoreCategory,
    status: lead.status,
    intent: lead.intent,
    timeline: lead.timeline || meta.timeline || "Within 30 Days",
    nextAction:
      lead.nextAction || meta.nextAction || "Pending qualification review",
    createdAt: lead.createdAt.toISOString(),
    aiNotes: lead.inboundNotes || meta.aiNotes || undefined,
    source: lead.source,
    assignedBroker: agent?.name || meta.assignedBroker || undefined,
    propertyId: lead.propertyId || undefined,
    managementMode: lead.managementMode,
    isAiStopped: lead.isAiStopped,
    aiStoppedReason: lead.aiStoppedReason || undefined,
  };
}

export function toLeadActivityDto(event: LeadEventRecord): LeadActivityDto {
  const meta = (event.metadata || {}) as Record<string, any>;

  return {
    id: event.id,
    type: event.type,
    title: event.title,
    description: event.description,
    timestamp: event.createdAt.toISOString(),
    channel: event.channel || undefined,
    status: meta.status || undefined,
    actor: {
      type: event.actorType,
      id: event.actorId || undefined,
      name:
        meta.brokerName ||
        meta.actorName ||
        (event.actorType === "human_broker" ? "Sales Broker" : "AI Agent"),
    },
    meta: meta,
  };
}

export function toLeadDetailDto(
  lead: LeadRecord,
  property?: PropertyRecord | null,
  agent?: AgentRecord | null,
  score?: LeadScoreRecord | null,
  qualification?: QualificationResultRecord | null,
  events?: LeadEventRecord[]
): LeadDetailDto {
  const summary = toLeadSummaryDto(lead, property, agent);
  const meta = (lead.metadata || {}) as Record<string, any>;

  let propertyDetails = meta.propertyDetails;
  if (property) {
    propertyDetails = {
      propertyTitle: property.title,
      location: property.location,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms ?? undefined,
      bathrooms: property.bathrooms ?? undefined,
      squareMeters: property.squareMeters ?? undefined,
      targetPrice: property.formattedPrice,
      budgetMatch: "Within Budget",
      developmentStage: property.developmentStage ?? undefined,
      estateName: property.estateName ?? undefined,
      featuredImage: property.featuredImage ?? undefined,
      images: property.images ?? [],
    };
  }

  let bantBreakdown = meta.bantBreakdown;
  if (score) {
    const factors = (score.factors || {}) as Record<string, any>;
    bantBreakdown = {
      budgetScore: score.budgetScore ?? 20,
      budgetNote: factors.budgetNote || "Declared budget alignment verified",
      authorityScore: score.authorityScore ?? 20,
      authorityNote: factors.authorityNote || "Sole decision maker confirmed",
      needScore: score.needScore ?? 20,
      needNote: factors.needNote || "Primary luxury residential requirement",
      timelineScore: score.timelineScore ?? 20,
      timelineNote: factors.timelineNote || "Ready to transact within 30 days",
      propertyFitScore: score.propertyFitScore ?? 20,
      propertyFitNote: factors.propertyFitNote || "High criteria match against inventory",
    };
  }

  let qualificationProfile = meta.qualificationProfile;
  if (qualification) {
    qualificationProfile = {
      confidenceScore: qualification.confidenceScore,
      buyerIntent: qualification.buyerIntent,
      intentSignals: qualification.intentSignals || [],
      motivation: qualification.motivation || "High-yield investment and primary residence",
      decisionReadiness: qualification.decisionReadiness,
      readinessNote: "Decision readiness evaluated via autonomous qualification",
      timelineWindow: qualification.timelineWindow || "< 30 days",
      timelineUrgency: qualification.timelineUrgency || "near_term",
      budgetAnalysis: {
        declared: qualification.budgetDeclared || lead.budget || "₦0",
        verifiedLiquidity: qualification.budgetVerifiedLiquidity || undefined,
        paymentStructure: qualification.paymentStructure || "Outright",
        budgetStretchPercentage: 0,
        stretchCategory: qualification.budgetStretchCategory || "Within Budget",
      },
      objections: qualification.objections || [],
      explainableBreakdown: {
        baseScore: qualification.confidenceScore,
        positiveFactors: [],
        riskFactors: [],
      },
    };
  }

  let lossDetails = meta.lossDetails;
  if (lead.lossReason) {
    lossDetails = {
      reason: lead.lossReason,
      reasonLabel: lead.lossReason,
      notes: lead.lossNotes || undefined,
      lostAt: lead.updatedAt.toISOString(),
    };
  }

  return {
    ...summary,
    property: property
      ? {
          id: property.id,
          slug: property.slug,
          title: property.title,
          location: property.location,
          city: property.city,
          state: property.state,
          propertyType: property.propertyType,
          price: Number(property.price),
          formattedPrice: property.formattedPrice,
          bedrooms: property.bedrooms ?? 0,
          bathrooms: property.bathrooms ?? 0,
          squareMeters: property.squareMeters ?? 0,
          availability: property.availability,
          verificationStatus: property.verificationStatus,
          featuredImage: property.featuredImage || "",
          images: property.images || [],
        }
      : undefined,
    propertyDetails,
    bantBreakdown,
    qualificationProfile,
    activities: events ? events.map(toLeadActivityDto) : undefined,
    nextActionDirective: meta.nextActionDirective,
    handoffContext: meta.handoffContext,
    recommendedAction: meta.recommendedAction,
    followUpSchedule: meta.followUpSchedule,
    lossDetails,
  };
}
