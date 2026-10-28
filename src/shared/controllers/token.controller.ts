import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../../auth/current-actor";
import type { Actor } from "../../auth/actor";
import { StaticTokenAuthGuard } from "../../auth/static-token-auth.guard";
import { SharedService } from "../shared.service";
import { TokenRequestDto, TokenResponseDto } from "../dto/token.dto";

@Controller("shared/token")
@UseGuards(StaticTokenAuthGuard)
export class TokenController {
  constructor(private readonly service: SharedService) {}

  @Post()
  run(
    @Body() dto: TokenRequestDto,
    @CurrentActor() actor: Actor,
  ): TokenResponseDto {
    const result = this.service.execute({
      actorId: actor.id,
      name: dto.display_name,
      items: dto.values.map((line) => ({
        code: line.item_code,
        value: line.item_value,
      })),
    });

    // This controller's snake_case contract is confined to this controller.
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
