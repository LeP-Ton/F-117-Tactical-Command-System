import type { MissionSession } from "../../domain/types";
import type { MapElementSelection } from "../mapSelection";
import { DeploymentBriefingPanel } from "../DeploymentBriefingPanel";
import { MapElementPanel } from "../MapElementPanel";
import { TacticalMapStage } from "../TacticalMapStage";
import { TacticalWorkspace } from "../TacticalWorkspace";
import { WeatherForecastPanel } from "../WeatherForecastPanel";

interface IntelligenceWorkspaceProps {
  mission: MissionSession;
  showBelief: boolean;
  mapSelection: MapElementSelection | null;
  onMapSelectionChange: (selection: MapElementSelection | null) => void;
  onClose: () => void;
}

export function IntelligenceWorkspace({ mission, showBelief, mapSelection, onMapSelectionChange, onClose }: IntelligenceWorkspaceProps) {
  return <TacticalWorkspace
    className="intelligence-workspace"
    leftPanel={<aside className="control-panel">
      <section className="panel-section">
        <div className="section-kicker">CURRENT ESTIMATE</div>
        <h2>预览任务</h2>
        <p className="hint">只读情报研判 // 任务尚未授权执行</p>
        <button className="primary-button return-network-button" onClick={onClose}>返回任务网络</button>
      </section>
      <WeatherForecastPanel mission={mission} />
    </aside>}
    mapStage={<TacticalMapStage
      variant="INTELLIGENCE"
      mission={mission}
      showBelief={showBelief}
      selectedIndex={null}
      onSelect={() => undefined}
      dispatch={() => undefined}
      mapSelection={mapSelection}
      readOnly
      statusText="CURRENT ESTIMATE"
    />}
    rightPanel={<aside className="telemetry-panel">
      <MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={onMapSelectionChange} defaultExpandedGroups />
      <DeploymentBriefingPanel title="COUNTER DEPLOYMENT" notes={mission.adaptationNotes} defaultExpanded />
    </aside>}
  />;
}
