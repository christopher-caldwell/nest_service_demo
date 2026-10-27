// Owned by the business layer. Neither controllers nor vendor DTOs belong here.
import type { DestinationCountry } from "./shipping.models";

export const SHIPPING_RATE_PROVIDER = Symbol("SHIPPING_RATE_PROVIDER");

export interface ShippingRateRequest {
  destinationCountry: DestinationCountry;
  weightGrams: number;
}

export interface ShippingRate {
  carrier: string;
  currency: "USD";
  costCents: number;
  estimatedDays: number;
}

export interface ShippingRateProvider {
  getRate(request: ShippingRateRequest): Promise<ShippingRate>;
}

// Adapters translate vendor failures into this business-owned error.
export class ShippingRateUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("Shipping rates are temporarily unavailable", options);
    this.name = "ShippingRateUnavailableError";
  }
}
