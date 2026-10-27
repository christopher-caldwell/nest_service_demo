import { IsInt, Min } from "class-validator";

export class Group2Controller2RequestDto {
  @IsInt()
  @Min(0)
  input_value!: number;
}

export class Group2Controller2ResponseDto {
  result_id!: string;
  total_value!: number;
  values!: { key: string; amount: number }[];
}
