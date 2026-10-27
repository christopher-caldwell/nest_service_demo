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

export class JwtOrderItemDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  sku!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class JwtCreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  customerName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JwtOrderItemDto)
  items!: JwtOrderItemDto[];
}

export class JwtOrderResponseDto {
  order!: {
    id: string;
    customerName: string;
    status: string;
    totalQuantity: number;
    items: { id: string; sku: string; quantity: number }[];
  };
}
