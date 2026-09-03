import { useState } from "react";
import type { MissionDebrief } from "../../domain/types";
import { CollapsibleSection } from "../CollapsibleSection";
import { EnemyStateSummary, RadarOperatorList } from "../EnemySystemPanels";
import { MapElementPanel } from "../MapElementPanel";
import type { MapElementSelection } from "../mapSelection";
import { TacticalMapStage } from "../TacticalMapStage";
import { TacticalWorkspace } from "../TacticalWorkspace";
import { useI18n } from "../../i18n/I18n";

interface DebriefWorkspaceProps {
  debrief: MissionDebrief;
  mapSelection: MapElementSelection | null;
  onMapSelectionChange: (selection: MapElementSelection | null) => void;
  onClose: () => void;
}

/** 历史复盘只读取冻结快照；全景切换不会接触或修改当前任务状态。 */
export function DebriefWorkspace({ debrief, mapSelection, onMapSelectionChange, onClose }: DebriefWorkspaceProps) {
  const { copy } = useI18n();
  const [panoramic, setPanoramic] = useState(false);
  const mission = debrief.mission;
  return <TacticalWorkspace
    className="intelligence-workspace"
    leftPanel={<aside className="control-panel">
      <section className="panel-section">
        <div className="section-kicker">{copy.debrief.kicker}</div>
        <h2>{copy.debrief.title}</h2>
        <p className="hint">{copy.debrief.snapshot} // {debrief.nodeId}</p>
        <dl className="telemetry-grid">
          <div><dt>{copy.debrief.missionTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} {copy.common.secondsUnit}</dd></div>
          <div><dt>{copy.debrief.finalCoordinates}</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
          <div><dt>{copy.debrief.remainingFuel}</dt><dd>{mission.aircraft.fuelRemaining.toFixed(0)} u</dd></div>
          <div><dt>{copy.debrief.intelAccess}</dt><dd>{debrief.intelAccessTier}/2</dd></div>
        </dl>
        <div className="button-row">
          <button className="secondary-button" onClick={() => setPanoramic((value) => !value)}>{panoramic ? copy.debrief.missionView : copy.debrief.panoramicView}</button>
          <button className="primary-button return-network-button" onClick={onClose}>{copy.control.returnNetwork}</button>
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
      statusText={panoramic ? copy.debrief.panoramicViewStatus : copy.debrief.missionViewStatus}
    />}
    rightPanel={<aside className="telemetry-panel">
      <MapElementPanel mission={mission} showBelief={panoramic} selection={mapSelection} onSelectionChange={onMapSelectionChange} defaultExpandedGroups />
      {panoramic && <CollapsibleSection className="debug-group" title={copy.debrief.enemySystemAnalysis} meta={copy.debrief.frozen}>
        <EnemyStateSummary mission={mission} density="compact" />
        <RadarOperatorList mission={mission} />
      </CollapsibleSection>}
    </aside>}
  />;
}
