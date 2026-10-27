import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentActor } from "../../auth/current-actor";
import type { Actor } from "../../auth/actor";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { ShippingQuotesService } from "../../business/shipping/shipping-quotes.service";
import {
  CheckoutShippingRequestDto,
  CheckoutShippingResponseDto,
} from "./checkout-shipping.dto";

@Controller("checkout/shipping-quotes")
@UseGuards(JwtAuthGuard)
export class CheckoutShippingController {
  constructor(private readonly shipping: ShippingQuotesService) {}

  @Post()
  async create(
    @Body() dto: CheckoutShippingRequestDto,
    @CurrentActor() actor: Actor,
  ): Promise<CheckoutShippingResponseDto> {
    const result = await this.shipping.createQuote({
      actorId: actor.id,
      destinationCountry: dto.destinationCountry,
      weightGrams: dto.weightGrams,
      orderSubtotalCents: dto.orderSubtotalCents,
    });

    return {
      quote: {
        id: result.entityOne.id,
        carrier: result.entityOne.carrier,
        estimatedDays: result.entityOne.estimatedDays,
        currency: result.entityOne.currency,
        totalCents: result.entityOne.totalCents,
        freeShipping: result.entityOne.freeShipping,
        breakdown: result.entityTwos.map((line) => ({
          label: line.kind,
          amountCents: line.amountCents,
        })),
      },
    };
  }
}
