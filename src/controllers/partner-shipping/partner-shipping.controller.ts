import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Actor, CurrentActor } from "../../auth/current-actor";
import { StaticTokenAuthGuard } from "../../auth/static-token-auth.guard";
import { ShippingQuotesService } from "../../shipping/shipping-quotes.service";
import {
  PartnerShippingRequestDto,
  PartnerShippingResponseDto,
} from "./partner-shipping.dto";

@Controller("partner/shipping-quotes")
@UseGuards(StaticTokenAuthGuard)
export class PartnerShippingController {
  constructor(private readonly shipping: ShippingQuotesService) {}

  @Post()
  async create(
    @Body() dto: PartnerShippingRequestDto,
    @CurrentActor() actor: Actor,
  ): Promise<PartnerShippingResponseDto> {
    const result = await this.shipping.createQuote({
      actorId: actor.id,
      destinationCountry: dto.destination_country,
      weightGrams: dto.package_weight_grams,
      orderSubtotalCents: dto.order_value_cents,
    });

    return {
      quote_ref: result.entityOne.id,
      carrier_name: result.entityOne.carrier,
      delivery_days: result.entityOne.estimatedDays,
      currency_code: result.entityOne.currency,
      shipping_charge_cents: result.entityOne.totalCents,
      shipping_waived: result.entityOne.freeShipping,
      charge_lines: result.entityTwos.map((line) => ({
        code: line.kind.toUpperCase(),
        value_cents: line.amountCents,
      })),
    };
  }
}
