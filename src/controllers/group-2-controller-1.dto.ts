export class Group2Controller1RequestDto {
  value!: number;
}

export class Group2Controller1ResponseDto {
  result!: {
    id: string;
    total: number;
    parts: { name: string; value: number }[];
  };
}
