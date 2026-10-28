export class Group1Controller1RequestDto {
  name!: string;
  items!: { code: string; value: number }[];
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
