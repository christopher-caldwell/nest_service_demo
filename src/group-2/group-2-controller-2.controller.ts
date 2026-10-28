import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../auth/current-actor";
import type { Actor } from "../auth/actor";
import { StaticTokenAuthGuard } from "../auth/static-token-auth.guard";
import { FeatureService } from "./feature.service";
import {
  Group2Controller2RequestDto,
  Group2Controller2ResponseDto,
} from "./dto/group-2-controller-2.dto";

@Controller("group-2/controller-2")
@UseGuards(StaticTokenAuthGuard)
export class Group2Controller2 {
  constructor(private readonly service: FeatureService) {}

  @Post()
  async run(
    @Body() dto: Group2Controller2RequestDto,
    @CurrentActor() actor: Actor,
  ): Promise<Group2Controller2ResponseDto> {
    const result = await this.service.execute({
      actorId: actor.id,
      value: dto.input_value,
    });
    return {
      result_id: result.entityOne.id,
      total_value: result.entityOne.total,
      values: result.entityTwos.map((item) => ({
        key: item.name,
        amount: item.value,
      })),
    };
  }
}
