import { Logger } from "@nestjs/common";
import {
  ProviderPort,
  ProviderInput,
  ProviderOutput,
  ProviderError,
} from "../business/group-2/provider.port";

// The simulated LIVE adapter. A real integration belongs here.
export class ProviderAdapter implements ProviderPort {
  private readonly logger = new Logger(ProviderAdapter.name);

  async fetchValue(input: ProviderInput): Promise<ProviderOutput> {
    try {
      const response = await this.callProvider({ input_value: input.value });
      // Provider-specific fields stop here.
      return { value: response.output_value };
    } catch (cause) {
      // Provider-specific exceptions stop here too.
      throw new ProviderError({ cause });
    }
  }

  private async callProvider(request: { input_value: number }) {
    this.logger.log(`SIMULATED live call: ${JSON.stringify(request)}`);
    // Replace this body with SDK/HTTP code in a real app. No network in this demo.
    return { output_value: request.input_value * 3 };
  }
}
