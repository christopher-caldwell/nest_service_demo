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

export class Group1Controller1ItemDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  code!: string;

  @IsInt()
  @Min(1)
  value!: number;
}

export class Group1Controller1RequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Group1Controller1ItemDto)
  items!: Group1Controller1ItemDto[];
}

export class Group1Controller1ResponseDto {
  result!: {
    id: string;
    name: string;
    status: string;
    total: number;
    items: { id: string; code: string; value: number }[];
  };
}
