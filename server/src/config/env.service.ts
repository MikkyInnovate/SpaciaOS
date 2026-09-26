import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvConfig } from "./env.schema";

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  get port(): number {
    return this.configService.get("PORT", { infer: true });
  }

  get nodeEnv(): "development" | "production" | "test" {
    return this.configService.get("NODE_ENV", { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get("DATABASE_URL", { infer: true });
  }

  get frontendUrl(): string {
    return this.configService.get("FRONTEND_URL", { infer: true });
  }

  get clerkSecretKey(): string {
    return this.configService.get("CLERK_SECRET_KEY", { infer: true });
  }

  get clerkPublishableKey(): string | undefined {
    return this.configService.get("CLERK_PUBLISHABLE_KEY", { infer: true });
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }

  get redisUrl(): string | undefined {
    return this.configService.get("REDIS_URL", { infer: true });
  }

  get redisHost(): string {
    return this.configService.get("REDIS_HOST", { infer: true }) || "localhost";
  }

  get redisPort(): number {
    return this.configService.get("REDIS_PORT", { infer: true }) || 6379;
  }

  get redisPassword(): string | undefined {
    return this.configService.get("REDIS_PASSWORD", { infer: true });
  }

  get openRouterApiKey(): string | undefined {
    return this.configService.get("OPENROUTER_API_KEY", { infer: true });
  }

  get openRouterBaseUrl(): string {
    return this.configService.get("OPENROUTER_BASE_URL", { infer: true });
  }

  get openRouterDefaultModel(): string {
    return this.configService.get("OPENROUTER_DEFAULT_MODEL", { infer: true });
  }

  get aiProvider(): "openrouter" | "mock" {
    return this.configService.get("AI_PROVIDER", { infer: true });
  }

  get aiMaxToolIterations(): number {
    return this.configService.get("AI_MAX_TOOL_ITERATIONS", { infer: true });
  }

  get aiContextWindowSize(): number {
    return this.configService.get("AI_CONTEXT_WINDOW_SIZE", { infer: true });
  }

  get vapiApiKey(): string | undefined {
    return this.configService.get("VAPI_API_KEY", { infer: true });
  }

  get vapiBaseUrl(): string {
    return this.configService.get("VAPI_BASE_URL", { infer: true });
  }

  get vapiPhoneNumberId(): string | undefined {
    return this.configService.get("VAPI_PHONE_NUMBER_ID", { infer: true });
  }

  get vapiAssistantId(): string | undefined {
    return this.configService.get("VAPI_ASSISTANT_ID", { infer: true });
  }

  get vapiWebhookSecret(): string | undefined {
    return this.configService.get("VAPI_WEBHOOK_SECRET", { infer: true });
  }

  get vapiProvider(): "vapi" | "mock" {
    return this.configService.get("VAPI_PROVIDER", { infer: true });
  }
}
