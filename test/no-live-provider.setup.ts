// Fail before live code is imported or constructed. A future real SDK must never
// run just because someone changes the application's commented adapter binding.
jest.mock("../src/providers/shipping/live-shipping-rate.adapter", () => ({
  LiveShippingRateAdapter: jest.fn().mockImplementation(() => {
    throw new Error(
      "Live provider construction is forbidden in tests; override SHIPPING_RATE_PROVIDER with the test adapter",
    );
  }),
}));
