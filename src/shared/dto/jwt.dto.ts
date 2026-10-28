export class JwtRequestDto {
  name!: string;
  items!: { code: string; value: number }[];
}

export class JwtResponseDto {
  result!: {
    id: string;
    name: string;
    status: string;
    total: number;
    items: { id: string; code: string; value: number }[];
  };
}
