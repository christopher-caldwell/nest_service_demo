export interface FeatureCommand {
  actorId: string;
  value: number;
}

export interface EntityOne {
  id: string;
  createdBy: string;
  total: number;
}

export interface EntityTwo {
  name: "provider" | "local";
  value: number;
}

export interface FeatureResult {
  entityOne: EntityOne;
  entityTwos: EntityTwo[];
}
