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

export class Group1Controller2ItemDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  key!: string;

  @IsInt()
  @Min(1)
  amount!: number;
}

export class Group1Controller2RequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  label!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Group1Controller2ItemDto)
  entries!: Group1Controller2ItemDto[];
}

export class Group1Controller2ResponseDto {
  reference!: string;
  label!: string;
  accepted!: boolean;
  total!: number;
  entries!: { reference: string; key: string; amount: number }[];
}
