import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../../auth/current-actor";
import type { Actor } from "../../auth/actor";
import { SessionAuthGuard } from "../../auth/session-auth.guard";
import { SharedService } from "../shared.service";
import { SessionRequestDto, SessionResponseDto } from "../dto/session.dto";

@Controller("shared/session")
@UseGuards(SessionAuthGuard)
export class SessionController {
  constructor(private readonly service: SharedService) {}

  @Post()
  run(
    @Body() dto: SessionRequestDto,
    @CurrentActor() actor: Actor,
  ): SessionResponseDto {
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
