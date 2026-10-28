import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SharedService } from "./shared.service";
import { Group1Controller1 } from "./group-1-controller-1.controller";
import { Group1Controller2 } from "./group-1-controller-2.controller";
import { Group1Controller3 } from "./group-1-controller-3.controller";

@Module({
  imports: [AuthModule],
  controllers: [Group1Controller1, Group1Controller2, Group1Controller3],
  providers: [SharedService],
})
export class Group1Module {}
