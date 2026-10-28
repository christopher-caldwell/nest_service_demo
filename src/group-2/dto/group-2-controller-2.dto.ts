export class Group2Controller2RequestDto {
  input_value!: number;
}

export class Group2Controller2ResponseDto {
  result_id!: string;
  total_value!: number;
  values!: { key: string; amount: number }[];
}
