// Fail before live code is imported or constructed. A future real SDK must never
// run just because someone changes the application's commented adapter binding.
jest.mock("../src/providers/provider.adapter", () => ({
  ProviderAdapter: jest.fn().mockImplementation(() => {
    throw new Error(
      "Live provider construction is forbidden in tests; override PROVIDER_PORT with the test adapter",
    );
  }),
}));
