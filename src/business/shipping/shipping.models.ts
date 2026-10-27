export type DestinationCountry = "US" | "CA";

export interface CreateShippingQuoteCommand {
  actorId: string;
  destinationCountry: DestinationCountry;
  weightGrams: number;
  orderSubtotalCents: number;
}

export interface ShippingQuote {
  id: string;
  createdBy: string;
  carrier: string;
  estimatedDays: number;
  currency: "USD";
  totalCents: number;
  freeShipping: boolean;
}

export interface ShippingChargeLine {
  kind: "carrier" | "handling" | "discount";
  amountCents: number;
}

export interface ShippingQuoteResult {
  entityOne: ShippingQuote;
  entityTwos: ShippingChargeLine[];
}
