import { DestinationCountry } from "./shipping-rate.port";

export interface CreateShippingQuoteCommand {
  actorId: string;
  destinationCountry: DestinationCountry;
  weightGrams: number;
  orderSubtotalCents: number;
}

export interface ShippingQuoteResult {
  entityOne: {
    id: string;
    createdBy: string;
    carrier: string;
    estimatedDays: number;
    currency: "USD";
    totalCents: number;
    freeShipping: boolean;
  };
  entityTwos: {
    kind: "carrier" | "handling" | "discount";
    amountCents: number;
  }[];
}
