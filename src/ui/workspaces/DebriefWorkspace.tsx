import { useState } from "react";
import type { MissionDebrief } from "../../domain/types";
import { CollapsibleSection } from "../CollapsibleSection";
import { EnemyStateSummary, RadarOperatorList } from "../EnemySystemPanels";
import { MapElementPanel } from "../MapElementPanel";
import type { MapElementSelection } from "../mapSelection";
import { TacticalMapStage } from "../TacticalMapStage";
import { TacticalWorkspace } from "../TacticalWorkspace";

interface DebriefWorkspaceProps {
  debrief: MissionDebrief;
  mapSelection: MapElementSelection | null;
  onMapSelectionChange: (selection: MapElementSelection | null) => void;
  onClose: () => void;
}

/** 历史复盘只读取冻结快照；全景切换不会接触或修改当前任务状态。 */
export function DebriefWorkspace({ debrief, mapSelection, onMapSelectionChange, onClose }: DebriefWorkspaceProps) {
  const [panoramic, setPanoramic] = useState(false);
  const mission = debrief.mission;
  return <TacticalWorkspace
    className="intelligence-workspace"
    leftPanel={<aside className="control-panel">
      <section className="panel-section">
        <div className="section-kicker">MISSION DEBRIEF</div>
        <h2>复盘任务</h2>
        <p className="hint">成功撤离快照 // {debrief.nodeId}</p>
        <dl className="telemetry-grid">
          <div><dt>任务时间</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div>
          <div><dt>最终坐标</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
          <div><dt>剩余燃油</dt><dd>{mission.aircraft.fuelRemaining.toFixed(0)} u</dd></div>
          <div><dt>情报权限</dt><dd>{debrief.intelAccessTier}/2</dd></div>
        </dl>
        <div className="button-row">
          <button className="secondary-button" onClick={() => setPanoramic((value) => !value)}>{panoramic ? "切换任务视角" : "切换全景复盘"}</button>
          <button className="primary-button return-network-button" onClick={onClose}>返回任务网络</button>
        </div>
      </section>
    </aside>}
    mapStage={<TacticalMapStage
      variant="DEBRIEF"
      mission={mission}
      showBelief={panoramic}
      selectedIndex={null}
      onSelect={() => undefined}
      dispatch={() => undefined}
      mapSelection={mapSelection}
      readOnly
      statusText={panoramic ? "全景复盘" : "任务视角"}
    />}
    rightPanel={<aside className="telemetry-panel">
      <MapElementPanel mission={mission} showBelief={panoramic} selection={mapSelection} onSelectionChange={onMapSelectionChange} defaultExpandedGroups />
      {panoramic && <CollapsibleSection className="debug-group" title="ENEMY SYSTEM ANALYSIS" meta="FROZEN">
        <EnemyStateSummary mission={mission} density="compact" />
        <RadarOperatorList mission={mission} />
      </CollapsibleSection>}
    </aside>}
  />;
}
