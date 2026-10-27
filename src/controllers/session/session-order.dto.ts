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

export class SessionBasketItemDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  productCode!: string;

  @IsInt()
  @Min(1)
  units!: number;
}

export class SessionCreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  buyerName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SessionBasketItemDto)
  basket!: SessionBasketItemDto[];
}

export class SessionOrderResponseDto {
  confirmation!: string;
  buyer!: string;
  accepted!: boolean;
  totalUnits!: number;
  basket!: { lineReference: string; productCode: string; units: number }[];
}
