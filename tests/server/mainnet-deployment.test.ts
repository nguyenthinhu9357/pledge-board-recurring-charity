import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const deployment = JSON.parse(
  readFileSync(
    join(process.cwd(), "contracts/pledge-board/deployment.json"),
    "utf8",
  ),
);

describe("Mainnet deployment evidence", () => {
  it("pins the live pledge contract and funding transaction", () => {
    expect(deployment.contractId).toBe(
      "CAMFL3HZIVSFYZH3HEBV6NLPQNK4LNQVWT6PUYXWE3JEL7YT4QEVWHGT",
    );
    expect(JSON.stringify(deployment)).toContain("ec0ab47a9bc969f46ebd840df02132b523e3c9c8ed4d37eb6ba5eed2f0aa869e");
  });
});
