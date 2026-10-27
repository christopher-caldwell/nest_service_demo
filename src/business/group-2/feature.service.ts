import { randomUUID } from "node:crypto";
import { InvalidBusinessInputError } from "../business-errors";
import { FeatureCommand, FeatureResult } from "./feature.models";
import { ProviderPort, ProviderError } from "./provider.port";

export class FeatureService {
  constructor(private readonly provider: ProviderPort) {}

  async execute(command: FeatureCommand): Promise<FeatureResult> {
    // These rules also apply to callers outside HTTP. Validate before any provider call.
    if (!command.actorId.trim()) {
      throw new InvalidBusinessInputError("An actor is required");
    }
    if (!Number.isSafeInteger(command.value) || command.value < 0) {
      throw new InvalidBusinessInputError(
        "Value must be a nonnegative safe integer",
      );
    }

    const output = await this.provider.fetchValue({ value: command.value });
    if (
      !output ||
      !Number.isSafeInteger(output.value) ||
      output.value < 0 ||
      !Number.isSafeInteger(output.value + 10)
    ) {
      throw new ProviderError();
    }

    // OUR logic: add 10 to the provider's value. Both adapters run through this code.
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
