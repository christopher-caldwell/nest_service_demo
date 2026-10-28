export class JwtRequestDto {
  value!: number;
}

export class JwtResponseDto {
  result!: {
    id: string;
    total: number;
    parts: { name: string; value: number }[];
  };
}
