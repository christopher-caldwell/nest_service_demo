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

export class Group1Controller3ItemDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  item_code!: string;

  @IsInt()
  @Min(1)
  item_value!: number;
}

export class Group1Controller3RequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  display_name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Group1Controller3ItemDto)
  values!: Group1Controller3ItemDto[];
}

export class Group1Controller3ResponseDto {
  result_id!: string;
  display_name!: string;
  state!: string;
  total_value!: number;
  values!: { item_id: string; item_code: string; item_value: number }[];
}
