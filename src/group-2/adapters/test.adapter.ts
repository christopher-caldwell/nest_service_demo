import { ProviderPort, ProviderInput, ProviderOutput } from "../provider.port";

export class TestAdapter implements ProviderPort {
  async fetchValue(input: ProviderInput): Promise<ProviderOutput> {
    // Local stand-in for the provider: deterministic, no SDK, network, or credentials.
    return { value: input.value * 2 };
  }
}
