import { Module, Global } from "@nestjs/common";
import { UsersRepository } from "./users.repository";

@Global()
@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
