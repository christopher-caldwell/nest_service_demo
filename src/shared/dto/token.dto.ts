export class TokenRequestDto {
  display_name!: string;
  values!: { item_code: string; item_value: number }[];
}

export class TokenResponseDto {
  result_id!: string;
  display_name!: string;
  state!: string;
  total_value!: number;
  values!: { item_id: string; item_code: string; item_value: number }[];
}
