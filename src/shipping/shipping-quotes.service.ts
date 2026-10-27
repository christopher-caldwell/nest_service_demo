import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  SHIPPING_RATE_PROVIDER,
  ShippingRateProvider,
} from "./shipping-rate.port";
import {
  CreateShippingQuoteCommand,
  ShippingQuoteResult,
} from "./shipping.models";

@Injectable()
export class ShippingQuotesService {
  constructor(
    @Inject(SHIPPING_RATE_PROVIDER)
    private readonly provider: ShippingRateProvider,
  ) {}

  async createQuote(
    command: CreateShippingQuoteCommand,
  ): Promise<ShippingQuoteResult> {
    // Only the provider boundary changes between live use and local tests.
    const rate = await this.provider.getRate({
      destinationCountry: command.destinationCountry,
      weightGrams: command.weightGrams,
    });

    // These are OUR rules. Both adapters run through this exact same code.
    const handlingFeeCents = 200;
    const freeShipping = command.orderSubtotalCents >= 10_000;
    const discountCents = freeShipping
      ? -(rate.costCents + handlingFeeCents)
      : 0;

    return {
      entityOne: {
        id: randomUUID(),
        createdBy: command.actorId,
        carrier: rate.carrier,
        estimatedDays: rate.estimatedDays,
        currency: "USD",
        totalCents: rate.costCents + handlingFeeCents + discountCents,
        freeShipping,
      },
      entityTwos: [
        { kind: "carrier", amountCents: rate.costCents },
        { kind: "handling", amountCents: handlingFeeCents },
        { kind: "discount", amountCents: discountCents },
      ],
    };
  }
}
