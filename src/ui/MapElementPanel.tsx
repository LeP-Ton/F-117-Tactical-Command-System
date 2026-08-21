import type { MissionSession } from "../domain/types";
import { radarTypeProfiles } from "../domain/radarTypes";
import { CollapsibleSection } from "./CollapsibleSection";
import { isSameMapSelection, type MapElementSelection } from "./mapSelection";

interface MapElementPanelProps {
  mission: MissionSession;
  showBelief: boolean;
  selection: MapElementSelection | null;
  onSelectionChange: (selection: MapElementSelection | null) => void;
}

const weatherLabels = {
  CLOUD: "云层",
  RAIN: "降雨",
  STORM: "风暴",
  FOG: "雾区",
} as const;

export function MapElementPanel({ mission, showBelief, selection, onSelectionChange }: MapElementPanelProps) {
  const select = (next: MapElementSelection) => {
    onSelectionChange(isSameMapSelection(selection, next) ? null : next);
  };
  const buttonClass = (next: MapElementSelection) =>
    `map-element-row ${isSameMapSelection(selection, next) ? "selected" : ""}`;
  const radarItems = showBelief
    ? mission.radars.map((radar) => ({
      id: radar.id,
      title: `${radar.id} · ${radarTypeProfiles[radar.type].label}`,
      detail: `真实位置 · 范围 ${radar.range.toFixed(0)} u · ${radar.operator.mode}`,
    }))
    : mission.radarIntel
      .filter((report) => report.estimatedPosition)
      .map((report) => ({
        id: report.radarId,
        title: `${report.radarId}? · ${radarTypeProfiles[report.radarType].label}`,
        detail: `${report.level} · 位置误差 ±${report.positionErrorRadius.toFixed(0)} u`,
      }));

  return (
    <CollapsibleSection className="map-elements-section" title="MAP ELEMENTS" meta="点击定位">
      <div className="map-element-list">
        <button className={buttonClass({ kind: "AIRCRAFT" })} onClick={() => select({ kind: "AIRCRAFT" })}>
          <strong>F-117</strong><span>己方飞机 · 点击高亮当前真实位置</span>
        </button>
        <button className={buttonClass({ kind: "TARGET" })} onClick={() => select({ kind: "TARGET" })}>
          <strong>{mission.target.id}</strong><span>任务目标 · 攻击半径 {mission.target.attackRadius} u</span>
        </button>
        <button className={buttonClass({ kind: "EXTRACTION" })} onClick={() => select({ kind: "EXTRACTION" })}>
          <strong>EXTRACTION</strong><span>摧毁目标后进入此区域完成撤离</span>
        </button>
        {mission.route.waypoints.map((waypoint, index) => (
          <button key={waypoint.id} className={buttonClass({ kind: "WAYPOINT", id: waypoint.id })} onClick={() => select({ kind: "WAYPOINT", id: waypoint.id })}>
            <strong>{index === 0 ? "INS" : `WP-${String(index).padStart(2, "0")}`} · 航点</strong>
            <span>{waypoint.status} · 飞行路线控制点</span>
          </button>
        ))}
        {mission.terrain.map((terrain) => (
          <button key={terrain.id} className={buttonClass({ kind: "TERRAIN", id: terrain.id })} onClick={() => select({ kind: "TERRAIN", id: terrain.id })}>
            <strong>{terrain.id} · 山地</strong>
            <span>雷达探测系数 {(terrain.detectionFactor * 100).toFixed(0)}% · 静态掩护区</span>
          </button>
        ))}
        {mission.weather.map((weather) => (
          <button key={weather.id} className={buttonClass({ kind: "WEATHER", id: weather.id })} onClick={() => select({ kind: "WEATHER", id: weather.id })}>
            <strong>{weather.id} · {weatherLabels[weather.kind]}</strong>
            <span>探测系数 {(weather.detectionFactor * 100).toFixed(0)}% · 动态移动/演化</span>
          </button>
        ))}
        {radarItems.map((radar) => (
          <button key={radar.id} className={buttonClass({ kind: "RADAR", id: radar.id })} onClick={() => select({ kind: "RADAR", id: radar.id })}>
            <strong>{radar.title}</strong><span>{radar.detail}</span>
          </button>
        ))}
      </div>
    </CollapsibleSection>
  );
}
