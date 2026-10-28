export const PROVIDER_PORT = Symbol("PROVIDER_PORT");

export interface ProviderInput {
  value: number;
}

export interface ProviderOutput {
  value: number;
}

// Both adapters implement this business-owned contract.
export interface ProviderPort {
  fetchValue(input: ProviderInput): Promise<ProviderOutput>;
}
