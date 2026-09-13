import { describe, expect, it } from "vitest";
import { mapToSimulationPosition, simulationAreaToMapOrigin, simulationToMapPosition } from "./mapCoordinates";

describe("玩家地图坐标转换", () => {
  it("以左下角为原点并保持 X 轴方向不变", () => {
    expect(mapToSimulationPosition({ x: 100, y: 100 })).toEqual({ x: 100, y: 900 });
    expect(mapToSimulationPosition({ x: 100, y: 900 })).toEqual({ x: 100, y: 100 });
    expect(simulationToMapPosition({ x: 900, y: 100 })).toEqual({ x: 900, y: 900 });
  });

  it("矩形内部左上角可转换为玩家地图左下角", () => {
    expect(simulationAreaToMapOrigin({ x: 50, y: 50, height: 100 })).toEqual({ x: 50, y: 850 });
  });
});
