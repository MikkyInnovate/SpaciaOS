import { Injectable, Logger, BadGatewayException, ServiceUnavailableException } from "@nestjs/common";
import { EnvService } from "../../../config/env.service";
import {
  IAiProvider,
  ChatMessage,
  AiToolDefinition,
  AiCompletionOptions,
  AiCompletionResponse,
  AiToolCall,
} from "../interfaces/ai-agent.interface";

@Injectable()
export class OpenRouterProvider implements IAiProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  readonly providerName = "openrouter";

  constructor(private readonly envService: EnvService) {}

  async chatCompletion(
    messages: ChatMessage[],
    tools: AiToolDefinition[],
    options: AiCompletionOptions
  ): Promise<AiCompletionResponse> {
    const apiKey = this.envService.openRouterApiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "OpenRouter API key is not configured in environment (OPENROUTER_API_KEY)."
      );
    }

    const rawModel = options.model || this.envService.openRouterDefaultModel;
    const baseUrl = this.envService.openRouterBaseUrl || "https://openrouter.ai/api/v1";
    const endpoint = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

    // Support OpenRouter model fallback routing for high availability
    const modelCandidates = rawModel.includes(",")
      ? rawModel.split(",").map((m) => m.trim())
      : rawModel.endsWith(":free")
      ? Array.from(new Set([rawModel, "nex-agi/nex-n2.5-mini:free", "qwen/qwen3.8-27b:free", "liquid/lfm-2.5-2.6b:free"]))
      : [rawModel];

    const requestBody: Record<string, any> = {
      ...(modelCandidates.length > 1 ? { models: modelCandidates } : { model: modelCandidates[0] }),
      messages: messages.map((m) => {
        const msg: Record<string, any> = {
          role: m.role,
          content: m.content,
        };
        if (m.name) msg.name = m.name;
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        if (m.tool_calls && m.tool_calls.length > 0) {
          msg.tool_calls = m.tool_calls;
        }
        return msg;
      }),
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1024,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://spacia.io",
          "X-Title": "SpaciaOS",
        },
        body: JSON.stringify(requestBody),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `OpenRouter API error (HTTP ${response.status}): ${errorText}`
        );
        throw new BadGatewayException(
          `OpenRouter API error (HTTP ${response.status}): ${errorText}`
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        throw new BadGatewayException("OpenRouter returned an empty choices array.");
      }

      const rawToolCalls = choice.message?.tool_calls;
      const toolCalls: AiToolCall[] | undefined = Array.isArray(rawToolCalls)
        ? rawToolCalls.map((tc: any) => ({
            id: tc.id || `call_${Date.now()}`,
            type: "function",
            function: {
              name: tc.function?.name || "",
              arguments: typeof tc.function?.arguments === "string"
                ? tc.function.arguments
                : JSON.stringify(tc.function?.arguments || {}),
            },
          }))
        : undefined;

      const usage = {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        latencyMs,
        model: data.model || rawModel,
        provider: this.providerName,
      };

      return {
        content: choice.message?.content || null,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
        usage,
        finishReason: choice.finish_reason || (toolCalls ? "tool_calls" : "stop"),
      };
    } catch (err: any) {
      if (err instanceof BadGatewayException || err instanceof ServiceUnavailableException) {
        throw err;
      }
      this.logger.error(`Failed to reach OpenRouter: ${err.message}`);
      throw new BadGatewayException(`Failed to communicate with OpenRouter: ${err.message}`);
    }
  }
}
