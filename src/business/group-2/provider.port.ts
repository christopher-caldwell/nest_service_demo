// The business layer owns this contract. It contains no provider-specific fields.
export const PROVIDER_PORT = Symbol("PROVIDER_PORT");

export interface ProviderInput {
  value: number;
}

export interface ProviderOutput {
  value: number;
}

export interface ProviderPort {
  fetchValue(input: ProviderInput): Promise<ProviderOutput>;
}

export class ProviderError extends Error {
  constructor(options?: ErrorOptions) {
    super("Provider unavailable", options);
    this.name = "ProviderError";
  }
}
