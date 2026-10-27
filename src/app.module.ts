import { Module } from "@nestjs/common";
import { Group1Module } from "./composition/group-1.module";
import { Group2Module } from "./composition/group-2.module";

@Module({ imports: [Group1Module, Group2Module] })
export class AppModule {}
