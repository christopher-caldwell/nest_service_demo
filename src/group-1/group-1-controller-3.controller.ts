import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../auth/current-actor";
import type { Actor } from "../auth/actor";
import { StaticTokenAuthGuard } from "../auth/static-token-auth.guard";
import { SharedService } from "./shared.service";
import {
  Group1Controller3RequestDto,
  Group1Controller3ResponseDto,
} from "./dto/group-1-controller-3.dto";

@Controller("group-1/controller-3")
@UseGuards(StaticTokenAuthGuard)
export class Group1Controller3 {
  constructor(private readonly service: SharedService) {}

  @Post()
  run(
    @Body() dto: Group1Controller3RequestDto,
    @CurrentActor() actor: Actor,
  ): Group1Controller3ResponseDto {
    const result = this.service.execute({
      actorId: actor.id,
      name: dto.display_name,
      items: dto.values.map((line) => ({
        code: line.item_code,
        value: line.item_value,
      })),
    });

    // Controller 3's snake_case contract is confined to this controller.
    return {
      result_id: result.entityOne.id,
      display_name: result.entityOne.name,
      state: result.entityOne.status.toUpperCase(),
      total_value: result.entityOne.total,
      values: result.entityTwos.map((line) => ({
        item_id: line.id,
        item_code: line.code,
        item_value: line.value,
      })),
    };
  }
}
