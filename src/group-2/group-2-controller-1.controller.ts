import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../auth/current-actor";
import type { Actor } from "../auth/actor";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FeatureService } from "./feature.service";
import {
  Group2Controller1RequestDto,
  Group2Controller1ResponseDto,
} from "./dto/group-2-controller-1.dto";

@Controller("group-2/controller-1")
@UseGuards(JwtAuthGuard)
export class Group2Controller1 {
  constructor(private readonly service: FeatureService) {}

  @Post()
  async run(
    @Body() dto: Group2Controller1RequestDto,
    @CurrentActor() actor: Actor,
  ): Promise<Group2Controller1ResponseDto> {
    const result = await this.service.execute({
      actorId: actor.id,
      value: dto.value,
    });
    return {
      result: {
        id: result.entityOne.id,
        total: result.entityOne.total,
        parts: result.entityTwos.map((item) => ({
          name: item.name,
          value: item.value,
        })),
      },
    };
  }
}
