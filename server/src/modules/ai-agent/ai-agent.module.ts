import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { AiToolsModule } from "../ai-tools/ai-tools.module";
import { LeadsModule } from "../leads/leads.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";
import { OpenRouterProvider } from "./providers/openrouter.provider";
import { MockAiProvider } from "./providers/mock-ai.provider";
import { AiProviderFactory, AI_PROVIDER_TOKEN } from "./providers/ai-provider.factory";
import { PromptBuilderService } from "./services/prompt-builder.service";
import { ConversationMemoryService } from "./services/conversation-memory.service";
import { StructuredExtractionService } from "./services/structured-extraction.service";
import { AiOrchestratorService } from "./services/ai-orchestrator.service";
import { AiAgentController } from "./ai-agent.controller";

@Module({
  imports: [
    DatabaseModule,
    AiToolsModule,
    LeadsModule,
    WorkspacesModule,
  ],
  controllers: [AiAgentController],
  providers: [
    OpenRouterProvider,
    MockAiProvider,
    AiProviderFactory,
    PromptBuilderService,
    ConversationMemoryService,
    StructuredExtractionService,
    AiOrchestratorService,
  ],
  exports: [
    AiOrchestratorService,
    AI_PROVIDER_TOKEN,
    OpenRouterProvider,
    MockAiProvider,
    PromptBuilderService,
    ConversationMemoryService,
    StructuredExtractionService,
  ],
})
export class AiAgentModule {}
