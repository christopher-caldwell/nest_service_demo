import { randomUUID } from "node:crypto";
import { InvalidBusinessInputError } from "../business-errors";
import {
  ShippingRateProvider,
  ShippingRateUnavailableError,
} from "./shipping-rate.port";
import {
  CreateShippingQuoteCommand,
  ShippingQuoteResult,
} from "./shipping.models";

export class ShippingQuotesService {
  constructor(private readonly provider: ShippingRateProvider) {}

  async createQuote(
    command: CreateShippingQuoteCommand,
  ): Promise<ShippingQuoteResult> {
    // These invariants apply to every caller, including a future job or CLI.
    // Reject invalid commands before contacting a potentially paid provider.
    if (!command.actorId.trim()) {
      throw new InvalidBusinessInputError("An actor is required");
    }
    if (!["US", "CA"].includes(command.destinationCountry)) {
      throw new InvalidBusinessInputError("Unsupported destination country");
    }
    if (
      !Number.isSafeInteger(command.weightGrams) ||
      command.weightGrams <= 0
    ) {
      throw new InvalidBusinessInputError(
        "Weight must be a positive safe integer",
      );
    }
    if (
      !Number.isSafeInteger(command.orderSubtotalCents) ||
      command.orderSubtotalCents < 0
    ) {
      throw new InvalidBusinessInputError(
        "Subtotal must be a nonnegative safe integer",
      );
    }
    // Only the provider boundary changes between live use and local tests.
    const rate = await this.provider.getRate({
      destinationCountry: command.destinationCountry,
      weightGrams: command.weightGrams,
    });

    // These are OUR rules. Both adapters run through this exact same code.
    const handlingFeeCents = 200;
    // A provider must honor the port's currency, units, and value constraints.
    if (
      !rate ||
      rate.currency !== "USD" ||
      typeof rate.carrier !== "string" ||
      !rate.carrier.trim() ||
      !Number.isSafeInteger(rate.costCents) ||
      rate.costCents < 0 ||
      !Number.isSafeInteger(rate.costCents + handlingFeeCents) ||
      !Number.isSafeInteger(rate.estimatedDays) ||
      rate.estimatedDays < 1
    ) {
      throw new ShippingRateUnavailableError();
    }
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
        currency: rate.currency,
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
