import { randomUUID } from "node:crypto";
import { SharedCommand, SharedResult } from "./shared.models";

export class SharedService {
  execute(command: SharedCommand): SharedResult {
    console.log("SharedService", command);
    const id = randomUUID();

    return {
      entityOne: {
        id,
        name: command.name,
        createdBy: command.actorId,
        status: "accepted",
        total: command.items.reduce((sum, item) => sum + item.value, 0),
      },
      entityTwos: command.items.map((item) => ({
        id: randomUUID(),
        entityOneId: id,
        code: item.code,
        value: item.value,
      })),
    };
  }
}
