import { Module } from "@nestjs/common";
import { SharedModule } from "./shared/shared.module";
import { AdapterModule } from "./adapter/adapter.module";

@Module({ imports: [SharedModule, AdapterModule] })
export class AppModule {}
