import { Injectable } from "@nestjs/common";
import {
  ShippingRate,
  ShippingRateProvider,
  ShippingRateRequest,
} from "../shipping-rate.port";

@Injectable()
export class TestShippingRateAdapter implements ShippingRateProvider {
  async getRate(request: ShippingRateRequest): Promise<ShippingRate> {
    // Fixed local fixtures, independent of weight. No network, SDK, or credentials.
    const fixtures: Record<
      ShippingRateRequest["destinationCountry"],
      ShippingRate
    > = {
      US: { carrier: "test-carrier", costCents: 500, estimatedDays: 3 },
      CA: { carrier: "test-carrier", costCents: 1_000, estimatedDays: 7 },
    };
    return { ...fixtures[request.destinationCountry] };
  }
}
