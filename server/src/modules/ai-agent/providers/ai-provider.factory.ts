import { FactoryProvider } from "@nestjs/common";
import { EnvService } from "../../../config/env.service";
import { OpenRouterProvider } from "./openrouter.provider";
import { MockAiProvider } from "./mock-ai.provider";
import { IAiProvider } from "../interfaces/ai-agent.interface";

export const AI_PROVIDER_TOKEN = "AI_PROVIDER_TOKEN";

export const AiProviderFactory: FactoryProvider<IAiProvider> = {
  provide: AI_PROVIDER_TOKEN,
  useFactory: (
    envService: EnvService,
    openRouterProvider: OpenRouterProvider,
    mockAiProvider: MockAiProvider
  ): IAiProvider => {
    const configuredProvider = envService.aiProvider;
    if (configuredProvider === "openrouter") {
      return openRouterProvider;
    }
    return mockAiProvider;
  },
  inject: [EnvService, OpenRouterProvider, MockAiProvider],
};
