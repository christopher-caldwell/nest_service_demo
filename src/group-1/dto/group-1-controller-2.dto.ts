export class Group1Controller2RequestDto {
  label!: string;
  entries!: { key: string; amount: number }[];
}

export class Group1Controller2ResponseDto {
  reference!: string;
  label!: string;
  accepted!: boolean;
  total!: number;
  entries!: { reference: string; key: string; amount: number }[];
}
