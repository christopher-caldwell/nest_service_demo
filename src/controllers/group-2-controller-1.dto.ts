import { IsInt, Min } from "class-validator";

export class Group2Controller1RequestDto {
  @IsInt()
  @Min(0)
  value!: number;
}

export class Group2Controller1ResponseDto {
  result!: {
    id: string;
    total: number;
    parts: { name: string; value: number }[];
  };
}
