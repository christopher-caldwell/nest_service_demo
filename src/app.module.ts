import { Module } from "@nestjs/common";
import { Group1Module } from "./group-1/group-1.module";
import { Group2Module } from "./group-2/group-2.module";

@Module({ imports: [Group1Module, Group2Module] })
export class AppModule {}
