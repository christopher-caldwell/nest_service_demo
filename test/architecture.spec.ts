import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import ts from "typescript";

const src = resolve(__dirname, "../src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : path.endsWith(".ts")
        ? [path]
        : [];
  });
}

function imports(path: string): string[] {
  return ts
    .preProcessFile(readFileSync(path, "utf8"))
    .importedFiles.map((entry) => entry.fileName);
}

it("keeps business dependencies inside business code or Node built-ins", () => {
  const business = join(src, "business");
  for (const file of sourceFiles(business)) {
    for (const dependency of imports(file)) {
      const allowed =
        dependency.startsWith("node:") ||
        (dependency.startsWith(".") &&
          resolve(dirname(file), dependency).startsWith(business + sep));
      expect({ file, dependency, allowed }).toEqual({
        file,
        dependency,
        allowed: true,
      });
    }
  }
});

it("keeps API DTO contracts independent of business and provider types", () => {
  for (const file of sourceFiles(join(src, "controllers")).filter((path) =>
    path.endsWith(".dto.ts"),
  )) {
    expect(
      imports(file).every((dependency) =>
        ["class-validator", "class-transformer"].includes(dependency),
      ),
    ).toBe(true);
  }
});

it("keeps concrete provider selection out of controllers and business services", () => {
  for (const file of [
    ...sourceFiles(join(src, "controllers")),
    ...sourceFiles(join(src, "business")),
  ]) {
    for (const dependency of imports(file)) {
      expect(dependency).not.toMatch(/providers|composition/);
    }
  }
});
