import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { PropertiesController } from "./properties.controller";
import { PropertiesService } from "./properties.service";
import { PropertyAdapterService } from "./property-adapter.service";
import { PropertyAdapterRegistry } from "./adapters/property-adapter.registry";
import { SpaciaNativePropertyAdapter } from "./adapters/spacia-native-property.adapter";
import { MockPmsPropertyAdapter } from "./adapters/mock-pms-property.adapter";

@Module({
  imports: [DatabaseModule],
  controllers: [PropertiesController],
  providers: [
    SpaciaNativePropertyAdapter,
    MockPmsPropertyAdapter,
    PropertyAdapterRegistry,
    PropertyAdapterService,
    PropertiesService,
  ],
  exports: [
    PropertyAdapterService,
    PropertiesService,
    PropertyAdapterRegistry,
    SpaciaNativePropertyAdapter,
    MockPmsPropertyAdapter,
  ],
})
export class PropertiesModule {}
