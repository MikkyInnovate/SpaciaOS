import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { ConfigModule } from "../../config/config.module";
import { LeadsModule } from "../leads/leads.module";
import { CallsController } from "./calls.controller";
import { CallsService } from "./calls.service";
import { VapiClientService } from "./services/vapi-client.service";
import { VapiWebhookService } from "./services/vapi-webhook.service";
import {
  HttpVapiTelephonyProvider,
  MockVapiTelephonyProvider,
} from "./providers/vapi-telephony.provider";

@Module({
  imports: [DatabaseModule, ConfigModule, LeadsModule],
  controllers: [CallsController],
  providers: [
    CallsService,
    VapiClientService,
    VapiWebhookService,
    HttpVapiTelephonyProvider,
    MockVapiTelephonyProvider,
  ],
  exports: [CallsService, VapiClientService, VapiWebhookService],
})
export class CallsModule {}
