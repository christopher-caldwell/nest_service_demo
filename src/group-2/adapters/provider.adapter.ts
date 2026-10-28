import { ProviderPort, ProviderInput, ProviderOutput } from "../provider.port";

export class ProviderAdapter implements ProviderPort {
  async fetchValue(input: ProviderInput): Promise<ProviderOutput> {
    const request = { input_value: input.value };
    console.log("Simulated live provider call", request);

    // A real SDK/HTTP call would go here. This demo uses a simulated response.
    const response = { output_value: request.input_value * 3 };
    return { value: response.output_value };
  }
}
