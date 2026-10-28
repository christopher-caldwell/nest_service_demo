import { randomUUID } from "node:crypto";
import { FeatureCommand, FeatureResult } from "./feature.models";
import { ProviderPort } from "./provider.port";

export class FeatureService {
  constructor(private readonly provider: ProviderPort) {}

  async execute(command: FeatureCommand): Promise<FeatureResult> {
    const output = await this.provider.fetchValue({ value: command.value });

    // Our business logic: add 10, regardless of which adapter is used.
    return {
      entityOne: {
        id: randomUUID(),
        createdBy: command.actorId,
        total: output.value + 10,
      },
      entityTwos: [
        { name: "provider", value: output.value },
        { name: "local", value: 10 },
      ],
    };
  }
}
