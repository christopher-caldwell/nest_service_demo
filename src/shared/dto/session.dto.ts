export class SessionRequestDto {
  label!: string;
  entries!: { key: string; amount: number }[];
}

export class SessionResponseDto {
  reference!: string;
  label!: string;
  accepted!: boolean;
  total!: number;
  entries!: { reference: string; key: string; amount: number }[];
}
