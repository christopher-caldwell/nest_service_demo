import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../../auth/current-actor";
import type { Actor } from "../../auth/actor";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { SharedService } from "../shared.service";
import { JwtRequestDto, JwtResponseDto } from "../dto/jwt.dto";

@Controller("shared/jwt")
@UseGuards(JwtAuthGuard)
export class JwtController {
  constructor(private readonly service: SharedService) {}

  @Post()
  run(
    @Body() dto: JwtRequestDto,
    @CurrentActor() actor: Actor,
  ): JwtResponseDto {
    // Translate this API's input contract into the shared business command.
    const result = this.service.execute({
      actorId: actor.id,
      name: dto.name,
      items: dto.items.map((item) => ({
        code: item.code,
        value: item.value,
      })),
    });

    // Compose both business entities into this API's nested response contract.
    return {
      result: {
        id: result.entityOne.id,
        name: result.entityOne.name,
        status: result.entityOne.status,
        total: result.entityOne.total,
        items: result.entityTwos.map((line) => ({
          id: line.id,
          code: line.code,
          value: line.value,
        })),
      },
    };
  }
}
