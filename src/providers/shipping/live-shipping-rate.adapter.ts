import { Injectable, Logger } from "@nestjs/common";
import {
  ShippingRate,
  ShippingRateProvider,
  ShippingRateRequest,
  ShippingRateUnavailableError,
} from "../../business/shipping/shipping-rate.port";

@Injectable()
export class LiveShippingRateAdapter implements ShippingRateProvider {
  private readonly logger = new Logger(LiveShippingRateAdapter.name);

  async getRate(request: ShippingRateRequest): Promise<ShippingRate> {
    try {
      const providerResponse = await this.requestVendor({
        country_code: request.destinationCountry,
        weight_grams: request.weightGrams,
      });
      // Vendor field names and units stop at this adapter.
      return {
        carrier: providerResponse.carrier_name,
        currency: providerResponse.currency_code,
        costCents: providerResponse.rate_in_cents,
        estimatedDays: providerResponse.transit_days,
      };
    } catch (cause) {
      // SDK/HTTP exceptions stop here too; callers see the port's error contract.
      throw new ShippingRateUnavailableError({ cause });
    }
  }

  private async requestVendor(request: {
    country_code: string;
    weight_grams: number;
  }) {
    this.logger.log(
      `SIMULATED live provider request: ${JSON.stringify(request)}`,
    );
    // Replace this method's body with the real SDK/HTTP call. No network in this demo.
    return {
      carrier_name: "simulated-live-carrier",
      currency_code: "USD" as const,
      rate_in_cents: request.country_code === "US" ? 925 : 1_525,
      transit_days: request.country_code === "US" ? 4 : 8,
    };
  }
}
