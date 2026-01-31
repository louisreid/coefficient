import { generateJoinCode } from "@/lib/joinCode";

describe("generateJoinCode", () => {
  it("generates a code with default prefix", () => {
    const spy = jest.spyOn(Math, "random").mockReturnValue(0);
    expect(generateJoinCode()).toBe("COE-AAAA");
    spy.mockRestore();
  });

  it("supports a custom prefix", () => {
    const spy = jest.spyOn(Math, "random").mockReturnValue(0);
    expect(generateJoinCode("TEST")).toBe("TEST-AAAA");
    spy.mockRestore();
  });
});
