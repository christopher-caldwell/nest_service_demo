// Owned by the business layer. Neither controllers nor vendor DTOs belong here.
export const SHIPPING_RATE_PROVIDER = Symbol("SHIPPING_RATE_PROVIDER");

export type DestinationCountry = "US" | "CA";

export interface ShippingRateRequest {
  destinationCountry: DestinationCountry;
  weightGrams: number;
}

export interface ShippingRate {
  carrier: string;
  costCents: number;
  estimatedDays: number;
}

export interface ShippingRateProvider {
  getRate(request: ShippingRateRequest): Promise<ShippingRate>;
}
