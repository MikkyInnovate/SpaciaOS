import {
  Injectable,
  Logger,
  BadGatewayException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { EnvService } from "../../../config/env.service";
import {
  IVapiTelephonyProvider,
  VapiOutboundCallPayload,
  VapiCallResponse,
} from "../interfaces/vapi.interface";

export const VAPI_TELEPHONY_PROVIDER = "VAPI_TELEPHONY_PROVIDER";

@Injectable()
export class HttpVapiTelephonyProvider implements IVapiTelephonyProvider {
  readonly providerName = "vapi" as const;
  private readonly logger = new Logger(HttpVapiTelephonyProvider.name);

  constructor(private readonly envService: EnvService) {}

  async createOutboundCall(
    payload: VapiOutboundCallPayload
  ): Promise<VapiCallResponse> {
    const apiKey = this.envService.vapiApiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "Vapi API key is not configured in environment (VAPI_API_KEY). Live outbound calls cannot be placed."
      );
    }

    const baseUrl = (this.envService.vapiBaseUrl || "https://api.vapi.ai").replace(
      /\/+$/,
      ""
    );
    const endpoint = `${baseUrl}/call`;

    this.logger.log(
      `Dispatching live outbound call via Vapi to ${payload.customer.number} [workspace: ${payload.metadata?.workspaceId}]`
    );

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      this.logger.error(`Vapi API network connection failure: ${err.message}`, err.stack);
      throw new BadGatewayException(
        `Failed to reach Vapi telephony gateway: ${err.message}`
      );
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown Vapi error");
      this.logger.error(
        `Vapi outbound call failed with HTTP status ${res.status}: ${errorText}`
      );
      throw new BadGatewayException(
        `Vapi telephony provider rejected call initiation (${res.status}): ${errorText}`
      );
    }

    const data = (await res.json()) as VapiCallResponse;
    return {
      id: data.id,
      status: data.status || "queued",
      phoneNumberId: data.phoneNumberId,
      type: data.type || "outboundPhoneCall",
      createdAt: data.createdAt || new Date().toISOString(),
    };
  }
}

@Injectable()
export class MockVapiTelephonyProvider implements IVapiTelephonyProvider {
  readonly providerName = "mock" as const;
  private readonly logger = new Logger(MockVapiTelephonyProvider.name);

  async createOutboundCall(
    payload: VapiOutboundCallPayload
  ): Promise<VapiCallResponse> {
    const mockCallId = `vapi_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.logger.log(
      `[MOCK VAPI] Simulated outbound call created: ${mockCallId} for ${payload.customer.number}`
    );

    return {
      id: mockCallId,
      status: "queued",
      phoneNumberId: payload.phoneNumberId || "mock_pn_sandbox_1",
      type: "outboundPhoneCall",
      createdAt: new Date().toISOString(),
    };
  }
}
