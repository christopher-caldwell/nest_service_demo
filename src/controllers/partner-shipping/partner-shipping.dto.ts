import { IsIn, IsInt, Min } from "class-validator";
import { DestinationCountry } from "../../shipping/shipping-rate.port";

export class PartnerShippingRequestDto {
  @IsIn(["US", "CA"])
  destination_country!: DestinationCountry;

  @IsInt()
  @Min(1)
  package_weight_grams!: number;

  @IsInt()
  @Min(0)
  order_value_cents!: number;
}

export class PartnerShippingResponseDto {
  quote_ref!: string;
  carrier_name!: string;
  delivery_days!: number;
  currency_code!: string;
  shipping_charge_cents!: number;
  shipping_waived!: boolean;
  charge_lines!: { code: string; value_cents: number }[];
}
