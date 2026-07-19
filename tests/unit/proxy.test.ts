import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "../../proxy";

describe("session proxy", () => {
  it("runs for protected application routes", () => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/dashboard" })).toBe(true);
  });

  it("does not run for static assets", () => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/_next/static/chunk.js" })).toBe(
      false,
    );
  });
});
