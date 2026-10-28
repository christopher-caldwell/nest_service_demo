import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../../auth/decorators/current-actor.decorator";
import type { Actor } from "../../auth/types/actor";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { FeatureService } from "../feature.service";
import { JwtRequestDto, JwtResponseDto } from "../dto/jwt.dto";

@Controller("adapter/jwt")
@UseGuards(JwtAuthGuard)
export class JwtController {
  constructor(private readonly service: FeatureService) {}

  @Post()
  async run(
    @Body() dto: JwtRequestDto,
    @CurrentActor() actor: Actor,
  ): Promise<JwtResponseDto> {
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
