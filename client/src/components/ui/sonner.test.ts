import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("toast presentation", () => {
  it("keeps notifications bottom-centered with visible semantic colors", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/components/ui/sonner.tsx"),
      "utf8",
    );

    expect(source).toContain('position="bottom-center"');
    expect(source).toContain("richColors");
    expect(source).toContain("!bg-emerald-700");
    expect(source).toContain("!bg-red-700");
    expect(source).toContain("!bg-[#8e4729]");
  });
});
