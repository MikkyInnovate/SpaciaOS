import { Injectable, Logger } from "@nestjs/common";
import { EnvService } from "../../../config/env.service";
import {
  HttpVapiTelephonyProvider,
  MockVapiTelephonyProvider,
} from "../providers/vapi-telephony.provider";
import {
  IVapiTelephonyProvider,
  VapiOutboundCallPayload,
  VapiCallResponse,
} from "../interfaces/vapi.interface";

@Injectable()
export class VapiClientService {
  private readonly logger = new Logger(VapiClientService.name);
  private readonly activeProvider: IVapiTelephonyProvider;

  constructor(
    private readonly envService: EnvService,
    private readonly httpProvider: HttpVapiTelephonyProvider,
    private readonly mockProvider: MockVapiTelephonyProvider
  ) {
    if (this.envService.vapiProvider === "vapi") {
      this.activeProvider = this.httpProvider;
      this.logger.log("VapiClientService initialized with HttpVapiTelephonyProvider (LIVE).");
    } else {
      this.activeProvider = this.mockProvider;
      this.logger.log("VapiClientService initialized with MockVapiTelephonyProvider (SANDBOX/TEST).");
    }
  }

  async dispatchOutboundCall(params: {
    workspaceId: string;
    leadId: string;
    callId: string;
    leadName: string;
    leadPhone: string;
    leadBudget?: string | null;
    propertyTitle?: string | null;
    propertyLocation?: string | null;
    persona?: string;
    customPrompt?: string;
  }): Promise<VapiCallResponse> {
    const payload: VapiOutboundCallPayload = {
      type: "outboundPhoneCall",
      phoneNumberId: this.envService.vapiPhoneNumberId,
      assistantId: this.envService.vapiAssistantId,
      customer: {
        number: params.leadPhone,
        name: params.leadName,
      },
      assistantOverrides: {
        variableValues: {
          leadName: params.leadName,
          leadBudget: params.leadBudget || "Market Tier",
          propertyTitle: params.propertyTitle || "Exclusive Spacia Portfolio",
          propertyLocation: params.propertyLocation || "Lagos",
          persona: params.persona || "Victoria",
          workspaceId: params.workspaceId,
          leadId: params.leadId,
          callId: params.callId,
        },
      },
      metadata: {
        workspaceId: params.workspaceId,
        leadId: params.leadId,
        callId: params.callId,
      },
    };

    return this.activeProvider.createOutboundCall(payload);
  }
}
