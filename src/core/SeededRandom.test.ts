import { describe, expect, it } from "vitest";
import { SeededRandom } from "./SeededRandom";

describe("SeededRandom", () => {
  it("相同 Seed 生成相同序列", () => {
    const first = new SeededRandom("night-hawk");
    const second = new SeededRandom("night-hawk");
    expect([first.next(), first.next(), first.next()]).toEqual([
      second.next(),
      second.next(),
      second.next(),
    ]);
  });

  it("range 结果处于指定区间", () => {
    const random = new SeededRandom("range-test");
    expect(random.range(10, 20)).toBeGreaterThanOrEqual(10);
    expect(random.range(10, 20)).toBeLessThan(20);
  });
});
