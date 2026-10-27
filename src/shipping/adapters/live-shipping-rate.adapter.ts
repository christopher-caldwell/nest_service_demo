import { Injectable, Logger } from "@nestjs/common";
import {
  ShippingRate,
  ShippingRateProvider,
  ShippingRateRequest,
} from "../shipping-rate.port";

@Injectable()
export class LiveShippingRateAdapter implements ShippingRateProvider {
  private readonly logger = new Logger(LiveShippingRateAdapter.name);

  async getRate(request: ShippingRateRequest): Promise<ShippingRate> {
    this.logger.log(
      `SIMULATED live provider request: ${JSON.stringify(request)}`,
    );

    // This is where a real SDK/HTTP call would go. This demo makes NO external call.
    // Model a vendor-shaped response, then translate it into our port's contract.
    const providerResponse = {
      carrier_name: "simulated-live-carrier",
      rate_in_cents: request.destinationCountry === "US" ? 925 : 1_525,
      transit_days: request.destinationCountry === "US" ? 4 : 8,
    };

    return {
      carrier: providerResponse.carrier_name,
      costCents: providerResponse.rate_in_cents,
      estimatedDays: providerResponse.transit_days,
    };
  }
}
