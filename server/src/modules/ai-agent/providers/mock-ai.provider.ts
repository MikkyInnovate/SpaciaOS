import { Injectable, Logger } from "@nestjs/common";
import {
  IAiProvider,
  ChatMessage,
  AiToolDefinition,
  AiCompletionOptions,
  AiCompletionResponse,
  AiToolCall,
} from "../interfaces/ai-agent.interface";

@Injectable()
export class MockAiProvider implements IAiProvider {
  private readonly logger = new Logger(MockAiProvider.name);
  readonly providerName = "mock";

  // Test hooks for fine-grained simulation
  public forceFailure = false;
  public forceLoop = false;
  public customToolCalls: AiToolCall[] | null = null;
  public customResponse: string | null = null;

  async chatCompletion(
    messages: ChatMessage[],
    tools: AiToolDefinition[],
    options: AiCompletionOptions
  ): Promise<AiCompletionResponse> {
    const startTime = Date.now();

    if (this.forceFailure) {
      throw new Error("Simulated AI Provider connection timeout (503 Service Unavailable).");
    }

    if (this.forceLoop) {
      return {
        content: null,
        toolCalls: [
          {
            id: `call_loop_${Date.now()}`,
            type: "function",
            function: {
              name: "search_properties",
              arguments: JSON.stringify({ query: "EndlessLoopTest" }),
            },
          },
        ],
        usage: {
          promptTokens: 120,
          completionTokens: 25,
          totalTokens: 145,
          latencyMs: 12,
          model: "spacia-deterministic-mock-v1",
          provider: this.providerName,
        },
        finishReason: "tool_calls",
      };
    }

    if (this.customToolCalls && this.customToolCalls.length > 0) {
      const tc = [...this.customToolCalls];
      this.customToolCalls = null; // consume
      return {
        content: null,
        toolCalls: tc,
        usage: {
          promptTokens: 100,
          completionTokens: 30,
          totalTokens: 130,
          latencyMs: 10,
          model: "spacia-deterministic-mock-v1",
          provider: this.providerName,
        },
        finishReason: "tool_calls",
      };
    }

    if (this.customResponse) {
      const res = this.customResponse;
      this.customResponse = null;
      return {
        content: res,
        usage: {
          promptTokens: 110,
          completionTokens: 40,
          totalTokens: 150,
          latencyMs: 15,
          model: "spacia-deterministic-mock-v1",
          provider: this.providerName,
        },
        finishReason: "stop",
      };
    }

    // Inspect recent dialogue history to decide next action
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const lastToolMsg = [...messages].reverse().find((m) => m.role === "tool");
    const userText = lastUserMsg?.content?.toLowerCase() || "";

    // 1. Anti-hallucination check: prompt asks for unverified feature
    if (userText.includes("helipad") || userText.includes("submarine") || userText.includes("casino")) {
      return {
        content: "I do not have a verified record of a private helipad or that feature for this property. Let me confirm that directly with the listing broker.",
        usage: {
          promptTokens: 140,
          completionTokens: 32,
          totalTokens: 172,
          latencyMs: Date.now() - startTime + 5,
          model: "spacia-deterministic-mock-v1",
          provider: this.providerName,
        },
        finishReason: "stop",
      };
    }

    // 2. Multi-tool loop scenario:
    // If search_properties tool has run, but get_property_price has not run yet, and user asked for price or full terms
    const hasSearchRan = messages.some(
      (m) => m.role === "tool" && m.name === "search_properties"
    );
    const hasPriceRan = messages.some(
      (m) => m.role === "tool" && m.name === "get_property_price"
    );

    if (hasSearchRan && !hasPriceRan && (userText.includes("price") || userText.includes("cost") || userText.includes("breakdown"))) {
      // Find propertyId from search result
      let targetId = "f700c406-c175-407a-88ba-a08d42bc924f";
      try {
        const parsed = JSON.parse(lastToolMsg?.content || "{}");
        if (parsed.data?.items?.[0]?.id) {
          targetId = parsed.data.items[0].id;
        }
      } catch {
        // fallback
      }

      return {
        content: null,
        toolCalls: [
          {
            id: `call_price_${Date.now()}`,
            type: "function",
            function: {
              name: "get_property_price",
              arguments: JSON.stringify({ propertyId: targetId }),
            },
          },
        ],
        usage: {
          promptTokens: 180,
          completionTokens: 35,
          totalTokens: 215,
          latencyMs: Date.now() - startTime + 8,
          model: "spacia-deterministic-mock-v1",
          provider: this.providerName,
        },
        finishReason: "tool_calls",
      };
    }

    // 3. If a tool was just executed, summarize the verified result
    if (lastToolMsg) {
      let toolData: any = {};
      try {
        toolData = JSON.parse(lastToolMsg.content || "{}");
      } catch {
        toolData = {};
      }

      if (lastToolMsg.name === "get_company_policy") {
        const policyTitle = toolData.data?.policies?.[0]?.title || "Company Commission Policy";
        const summary = toolData.data?.policies?.[0]?.summary || "Standard 5% purchase commission.";
        return {
          content: `According to our verified agency policy on ${policyTitle}: ${summary} This is strictly non-negotiable under LASRERA statutory guidelines.`,
          usage: {
            promptTokens: 220,
            completionTokens: 45,
            totalTokens: 265,
            latencyMs: Date.now() - startTime + 6,
            model: "spacia-deterministic-mock-v1",
            provider: this.providerName,
          },
          finishReason: "stop",
        };
      }

      if (lastToolMsg.name === "get_property_price") {
        const formattedPrice = toolData.data?.formattedPrice || "₦85,000,000";
        const serviceCharge = toolData.data?.commercialTerms?.serviceCharge || "₦2,500,000 / annum";
        return {
          content: `The verified asking price for this property is ${formattedPrice} with a mandatory service charge of ${serviceCharge}. Outright and installment plans are available.`,
          usage: {
            promptTokens: 240,
            completionTokens: 50,
            totalTokens: 290,
            latencyMs: Date.now() - startTime + 7,
            model: "spacia-deterministic-mock-v1",
            provider: this.providerName,
          },
          finishReason: "stop",
        };
      }

      // Default search_properties summarization
      const firstItem = toolData.data?.items?.[0];
      if (firstItem) {
        return {
          content: `I found ${toolData.data?.total || 1} verified property matching your inquiry: ${firstItem.title} in ${firstItem.location}, listed at ${firstItem.formattedPrice}. Would you like to review the commercial breakdown or arrange a private inspection?`,
          usage: {
            promptTokens: 260,
            completionTokens: 60,
            totalTokens: 320,
            latencyMs: Date.now() - startTime + 8,
            model: "spacia-deterministic-mock-v1",
            provider: this.providerName,
          },
          finishReason: "stop",
        };
      }

      return {
        content: `I reviewed our verified portfolio records, but no active properties matched those exact criteria. Let me know if you would like me to broaden the price or bedroom filters.`,
        usage: {
          promptTokens: 200,
          completionTokens: 40,
          totalTokens: 240,
          latencyMs: Date.now() - startTime + 5,
          model: "spacia-deterministic-mock-v1",
          provider: this.providerName,
        },
        finishReason: "stop",
      };
    }

    // 4. Initial inquiry routing to tools:
    if (userText.includes("policy") || userText.includes("commission") || userText.includes("fee")) {
      return {
        content: null,
        toolCalls: [
          {
            id: `call_policy_${Date.now()}`,
            type: "function",
            function: {
              name: "get_company_policy",
              arguments: JSON.stringify({ category: "commission" }),
            },
          },
        ],
        usage: {
          promptTokens: 150,
          completionTokens: 30,
          totalTokens: 180,
          latencyMs: Date.now() - startTime + 5,
          model: "spacia-deterministic-mock-v1",
          provider: this.providerName,
        },
        finishReason: "tool_calls",
      };
    }

    if (
      userText.includes("flat") ||
      userText.includes("apartment") ||
      userText.includes("penthouse") ||
      userText.includes("lekki") ||
      userText.includes("ikoyi") ||
      userText.includes("waterfront") ||
      userText.includes("property") ||
      userText.includes("bedroom")
    ) {
      return {
        content: null,
        toolCalls: [
          {
            id: `call_search_${Date.now()}`,
            type: "function",
            function: {
              name: "search_properties",
              arguments: JSON.stringify({
                query: userText.includes("lekki") ? "Lekki" : "Waterfront",
                limit: 2,
              }),
            },
          },
        ],
        usage: {
          promptTokens: 160,
          completionTokens: 35,
          totalTokens: 195,
          latencyMs: Date.now() - startTime + 6,
          model: "spacia-deterministic-mock-v1",
          provider: this.providerName,
        },
        finishReason: "tool_calls",
      };
    }

    // Conversational greeting or closing
    return {
      content: `Hello! I am your Spacia AI luxury property advisor. How can I assist you with prime real estate in Lagos today?`,
      usage: {
        promptTokens: 120,
        completionTokens: 30,
        totalTokens: 150,
        latencyMs: Date.now() - startTime + 5,
        model: "spacia-deterministic-mock-v1",
        provider: this.providerName,
      },
      finishReason: "stop",
    };
  }
}
