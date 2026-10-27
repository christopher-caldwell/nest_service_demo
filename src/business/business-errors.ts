// Plain business errors. The HTTP layer decides their status codes and shape.
export class InvalidBusinessInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidBusinessInputError";
  }
}
