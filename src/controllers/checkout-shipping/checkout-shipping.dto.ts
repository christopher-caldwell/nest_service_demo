import { IsIn, IsInt, Min } from "class-validator";
import { DestinationCountry } from "../../shipping/shipping-rate.port";

export class CheckoutShippingRequestDto {
  @IsIn(["US", "CA"])
  destinationCountry!: DestinationCountry;

  @IsInt()
  @Min(1)
  weightGrams!: number;

  @IsInt()
  @Min(0)
  orderSubtotalCents!: number;
}

export class CheckoutShippingResponseDto {
  quote!: {
    id: string;
    carrier: string;
    estimatedDays: number;
    currency: string;
    totalCents: number;
    freeShipping: boolean;
    breakdown: { label: string; amountCents: number }[];
  };
}
