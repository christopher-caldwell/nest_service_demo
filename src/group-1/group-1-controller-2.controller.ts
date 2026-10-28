import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../auth/current-actor";
import type { Actor } from "../auth/actor";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { SharedService } from "./shared.service";
import {
  Group1Controller2RequestDto,
  Group1Controller2ResponseDto,
} from "./dto/group-1-controller-2.dto";

@Controller("group-1/controller-2")
@UseGuards(SessionAuthGuard)
export class Group1Controller2 {
  constructor(private readonly service: SharedService) {}

  @Post()
  run(
    @Body() dto: Group1Controller2RequestDto,
    @CurrentActor() actor: Actor,
  ): Group1Controller2ResponseDto {
    const result = this.service.execute({
      actorId: actor.id,
      name: dto.label,
      items: dto.entries.map((item) => ({
        code: item.key,
        value: item.amount,
      })),
    });

    // A flat reference and renamed fields for a session-based client.
    return {
      reference: result.entityOne.id,
      label: result.entityOne.name,
      accepted: result.entityOne.status === "accepted",
      total: result.entityOne.total,
      entries: result.entityTwos.map((line) => ({
        reference: line.id,
        key: line.code,
        amount: line.value,
      })),
    };
  }
}
