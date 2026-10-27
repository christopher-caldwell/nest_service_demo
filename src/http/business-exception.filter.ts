import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { InvalidBusinessInputError } from "../business/business-errors";
import { ShippingRateUnavailableError } from "../business/shipping/shipping-rate.port";

@Catch(InvalidBusinessInputError, ShippingRateUnavailableError)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(
    error: InvalidBusinessInputError | ShippingRateUnavailableError,
    host: ArgumentsHost,
  ): void {
    const isInvalidInput = error instanceof InvalidBusinessInputError;
    const statusCode = isInvalidInput ? 400 : 502;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({
        statusCode,
        error: isInvalidInput ? "Bad Request" : "Bad Gateway",
        // Never serialize provider errors, causes, stack traces, or SDK payloads.
        message: isInvalidInput
          ? error.message
          : "Shipping rates are temporarily unavailable",
      });
  }
}
