import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../../auth/decorators/current-actor.decorator";
import type { Actor } from "../../auth/types/actor";
import { StaticTokenAuthGuard } from "../../auth/guards/static-token-auth.guard";
import { FeatureService } from "../feature.service";
import { TokenRequestDto, TokenResponseDto } from "../dto/token.dto";

@Controller("adapter/token")
@UseGuards(StaticTokenAuthGuard)
export class TokenController {
  constructor(private readonly service: FeatureService) {}

  @Post()
  async run(
    @Body() dto: TokenRequestDto,
    @CurrentActor() actor: Actor,
  ): Promise<TokenResponseDto> {
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
