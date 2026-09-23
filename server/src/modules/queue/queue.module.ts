import { Module, Global } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { RedisConnectionService } from "./redis-connection.service";
import { BullMQQueueService } from "./bullmq-queue.service";

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [RedisConnectionService, BullMQQueueService],
  exports: [RedisConnectionService, BullMQQueueService],
})
export class QueueModule {}
