// Business types contain no HTTP, auth, or controller DTO dependencies.
export interface SharedCommand {
  actorId: string;
  name: string;
  items: { code: string; value: number }[];
}

export interface EntityOne {
  id: string;
  name: string;
  createdBy: string;
  status: "accepted";
  total: number;
}

export interface EntityTwo {
  id: string;
  entityOneId: string;
  code: string;
  value: number;
}

export interface SharedResult {
  entityOne: EntityOne;
  entityTwos: EntityTwo[];
}
