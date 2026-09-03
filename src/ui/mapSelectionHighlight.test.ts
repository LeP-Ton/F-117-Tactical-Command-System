import { describe, expect, it } from "vitest";
import { getSelectionCornerSegments, getSelectionPulseOpacity } from "./mapSelectionHighlight";

describe("地图元素选中效果", () => {
  it("在选中范围外生成四组实线角标", () => {
    const bounds = { x: 100, y: 200, width: 80, height: 60 };
    const segments = getSelectionCornerSegments(bounds, 6, 14);

    expect(segments).toHaveLength(8);
    expect(segments[0]).toEqual({
      from: { x: 94, y: 194 },
      to: { x: 108, y: 194 },
    });
    expect(segments[7]).toEqual({
      from: { x: 186, y: 252 },
      to: { x: 186, y: 266 },
    });
  });

  it("将呼吸闪烁透明度限制在清晰但不过亮的范围内", () => {
    const quarterCycle = 1100 / 4;
    const threeQuarterCycle = (1100 * 3) / 4;

    expect(getSelectionPulseOpacity(quarterCycle)).toBeCloseTo(1);
    expect(getSelectionPulseOpacity(threeQuarterCycle)).toBeCloseTo(0.38);
  });
});
