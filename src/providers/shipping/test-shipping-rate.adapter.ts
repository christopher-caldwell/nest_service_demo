import {
  ShippingRate,
  ShippingRateProvider,
  ShippingRateRequest,
} from "../../business/shipping/shipping-rate.port";

export class TestShippingRateAdapter implements ShippingRateProvider {
  async getRate(request: ShippingRateRequest): Promise<ShippingRate> {
    // Fixed local fixtures, independent of weight. No network, SDK, or credentials.
    const fixtures: Record<
      ShippingRateRequest["destinationCountry"],
      ShippingRate
    > = {
      US: {
        carrier: "test-carrier",
        currency: "USD",
        costCents: 500,
        estimatedDays: 3,
      },
      CA: {
        carrier: "test-carrier",
        currency: "USD",
        costCents: 1_000,
        estimatedDays: 7,
      },
    };
    return { ...fixtures[request.destinationCountry] };
  }
}
