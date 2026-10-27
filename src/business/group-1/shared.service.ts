import { randomUUID } from "node:crypto";
import { InvalidBusinessInputError } from "../business-errors";
import { SharedCommand, SharedResult } from "./shared.models";

export class SharedService {
  constructor(private readonly log: (message: string) => void = console.log) {}

  execute(command: SharedCommand): SharedResult {
    if (!command.actorId.trim() || !command.name.trim()) {
      throw new InvalidBusinessInputError("An actor and name are required");
    }
    if (
      command.items.length === 0 ||
      command.items.some(
        (item) =>
          !item.code.trim() ||
          !Number.isSafeInteger(item.value) ||
          item.value <= 0,
      )
    ) {
      throw new InvalidBusinessInputError(
        "Items require a code and positive safe integer value",
      );
    }
    const total = command.items.reduce((total, item) => total + item.value, 0);
    if (!Number.isSafeInteger(total)) {
      throw new InvalidBusinessInputError("Total exceeds the supported range");
    }
    const entityOneId = randomUUID();
    // Demo side effect; the business result is independent of any API DTO.
    this.log(`Group 1 command: ${JSON.stringify(command)}`);

    return {
      entityOne: {
        id: entityOneId,
        name: command.name,
        createdBy: command.actorId,
        status: "accepted",
        total,
      },
      entityTwos: command.items.map((item) => ({
        id: randomUUID(),
        entityOneId,
        code: item.code,
        value: item.value,
      })),
    };
  }
}
