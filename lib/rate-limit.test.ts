import { describe, expect, it } from "vitest";

import {
  checkRateLimit,
  clientIp,
  MAX_REQUESTS_PER_WINDOW,
} from "./rate-limit";

describe("checkRateLimit", () => {
  it(`admet ${MAX_REQUESTS_PER_WINDOW} requêtes puis refuse la suivante`, () => {
    const key = "ip-test-burst";
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
      expect(checkRateLimit(key, t0 + i).allowed).toBe(true);
    }
    const refused = checkRateLimit(key, t0 + MAX_REQUESTS_PER_WINDOW);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBeGreaterThan(0);
    expect(refused.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("la fenêtre glisse : une requête redevient possible après 60 s", () => {
    const key = "ip-test-window";
    const t0 = 2_000_000;
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
      checkRateLimit(key, t0);
    }
    expect(checkRateLimit(key, t0 + 1).allowed).toBe(false);
    expect(checkRateLimit(key, t0 + 60_001).allowed).toBe(true);
  });

  it("les clés sont indépendantes", () => {
    const t0 = 3_000_000;
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) {
      checkRateLimit("ip-a", t0);
    }
    expect(checkRateLimit("ip-a", t0).allowed).toBe(false);
    expect(checkRateLimit("ip-b", t0).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) =>
    new Request("https://exemple.fr", { headers });

  it("prend le premier maillon de x-forwarded-for", () => {
    expect(
      clientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })),
    ).toBe("203.0.113.7");
  });

  it("retombe sur x-real-ip puis sur une valeur neutre", () => {
    expect(clientIp(req({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
    expect(clientIp(req({}))).toBe("inconnue");
  });
});
