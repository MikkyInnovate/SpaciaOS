import { Module } from "@nestjs/common";
import { TesterController } from "./tester.controller";

@Module({
  controllers: [TesterController],
})
export class TesterModule {}
