export class TokenRequestDto {
  input_value!: number;
}

export class TokenResponseDto {
  result_id!: string;
  total_value!: number;
  values!: { key: string; amount: number }[];
}
