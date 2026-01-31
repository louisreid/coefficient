import { hashString, pick, seededRandom } from "@/lib/questions/random";

describe("hashString", () => {
  it("is deterministic for the same input", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
  });
});

describe("seededRandom", () => {
  it("produces repeatable sequences", () => {
    const first = seededRandom("seed");
    const second = seededRandom("seed");
    const seqA = [first(), first(), first()];
    const seqB = [second(), second(), second()];
    expect(seqA).toEqual(seqB);
  });
});

describe("pick", () => {
  it("selects items based on random value", () => {
    const rand = () => 0.99;
    expect(pick(rand, ["a", "b", "c"])).toBe("c");
  });
});
