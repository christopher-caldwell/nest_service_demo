import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";

export class PartnerLineDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  product_code!: string;

  @IsInt()
  @Min(1)
  count!: number;
}

export class PartnerCreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  customer_name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PartnerLineDto)
  lines!: PartnerLineDto[];
}

export class PartnerOrderResponseDto {
  order_ref!: string;
  customer_name!: string;
  state!: string;
  total_units!: number;
  line_items!: { line_ref: string; product_code: string; count: number }[];
}
