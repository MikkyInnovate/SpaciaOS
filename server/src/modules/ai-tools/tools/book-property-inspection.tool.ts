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
import { AppointmentsService } from "../../appointments/appointments.service";

export interface BookInspectionParams {
  propertyId: string;
  leadId?: string;
  targetDate: string; // ISO or YYYY-MM-DD
  timeSlot?: string; // e.g. "14:30"
  meetingFormat?: "in_person_viewing" | "virtual_tour" | "vip_private_showing";
  notes?: string;
  workspaceId?: string;
}

export interface BookingResult {
  success: boolean;
  appointmentId: string;
  propertyTitle: string;
  scheduledTime: string;
  assignedBroker: string;
  status: string;
  meetingFormat: string;
}

@Injectable()
export class BookPropertyInspectionTool
  implements IAiTool<BookInspectionParams, BookingResult>
{
  readonly name = "book_property_inspection";
  readonly description =
    "Book a scheduled in-person or live video property inspection for a qualified prospect, automatically performing real-time broker calendar clash checks.";
  readonly requiredPermission = "leads:write";

  readonly definition: ToolDefinition = {
    name: "book_property_inspection",
    description:
      "Book a scheduled in-person or live video property inspection for a qualified prospect, automatically performing real-time broker calendar clash checks.",
    parameters: {
      type: "object",
      properties: {
        propertyId: {
          type: "string",
          description: "Unique canonical UUID or identifier of the property to inspect",
        },
        leadId: {
          type: "string",
          description: "Optional UUID of the prospect lead requesting the viewing",
        },
        targetDate: {
          type: "string",
          description: "Target inspection date in ISO 8601 or YYYY-MM-DD format",
        },
        timeSlot: {
          type: "string",
          description: "Desired inspection time (e.g. 10:00, 14:30)",
        },
        meetingFormat: {
          type: "string",
          enum: ["in_person_viewing", "virtual_tour", "vip_private_showing"],
          description: "Format of inspection: in_person_viewing, virtual_tour, or vip_private_showing",
        },
        notes: {
          type: "string",
          description: "Special directives or prospect preferences for the walkthrough",
        },
      },
      required: ["propertyId", "targetDate"],
    },
  };

  constructor(private readonly appointmentsService: AppointmentsService) {}

  validateParams(rawParams: unknown): BookInspectionParams {
    if (typeof rawParams !== "object" || rawParams === null) {
      throw new BadRequestException("book_property_inspection parameters must be an object.");
    }
    const params = rawParams as Record<string, any>;

    if (!params.propertyId || typeof params.propertyId !== "string" || !params.propertyId.trim()) {
      throw new BadRequestException("propertyId is required and must be a non-empty string.");
    }

    if (!params.targetDate || typeof params.targetDate !== "string" || !params.targetDate.trim()) {
      throw new BadRequestException("targetDate is required and must be a non-empty string.");
    }

    return {
      propertyId: params.propertyId.trim(),
      leadId: typeof params.leadId === "string" ? params.leadId.trim() : undefined,
      targetDate: params.targetDate.trim(),
      timeSlot: typeof params.timeSlot === "string" ? params.timeSlot.trim() : undefined,
      meetingFormat: params.meetingFormat || "in_person_viewing",
      notes: typeof params.notes === "string" ? params.notes.trim() : undefined,
      workspaceId: typeof params.workspaceId === "string" ? params.workspaceId.trim() : undefined,
    };
  }

  async execute(
    params: BookInspectionParams,
    context: ToolExecutionContext
  ): Promise<{ data: BookingResult; sourceVerification: SourceVerification }> {
    if (!context.workspaceId) {
      throw new UnauthorizedException("Tool execution requires an active workspace context.");
    }

    const tenant = {
      workspaceId: context.workspaceId,
      userId: context.actorId || "ai_agent",
      role: context.role || "agent",
      permissions: context.permissions || ["leads:write", "leads:read"],
    };

    // Calculate start time
    const baseDate = new Date(params.targetDate);
    if (params.timeSlot) {
      const [hours, minutes] = params.timeSlot.split(":").map((n) => parseInt(n, 10));
      if (!isNaN(hours)) baseDate.setHours(hours, isNaN(minutes) ? 0 : minutes, 0, 0);
    } else {
      baseDate.setHours(14, 0, 0, 0); // Default 2:00 PM
    }

    const created = await this.appointmentsService.createAppointment(tenant as any, {
      propertyId: params.propertyId,
      leadId: params.leadId || "lead_inbound_ai",
      startTime: baseDate.toISOString(),
      meetingType: params.meetingFormat || "in_person_viewing",
      notes: params.notes || "Booked autonomously by AI Voice Specialist",
    });

    const result: BookingResult = {
      success: true,
      appointmentId: created.id,
      propertyTitle: created.propertyTitle,
      scheduledTime: created.startTime,
      assignedBroker: created.assignedBrokerName,
      status: created.status,
      meetingFormat: created.meetingType,
    };

    const sourceVerification: SourceVerification = {
      source: "Spacia Calendar Engine",
      providerId: created.calendarProvider || "native",
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      confidence: "authoritative",
      provenanceDetails: `Inspection scheduled and registered in broker calendar. Event ID: ${created.calendarEventId || created.id}.`,
    };

    return { data: result, sourceVerification };
  }
}
