import type { MissionSession } from "../../domain/types";
import type { MapElementSelection } from "../mapSelection";
import { DeploymentBriefingPanel } from "../DeploymentBriefingPanel";
import { MapElementPanel } from "../MapElementPanel";
import { TacticalMapStage } from "../TacticalMapStage";
import { TacticalWorkspace } from "../TacticalWorkspace";
import { WeatherForecastPanel } from "../WeatherForecastPanel";
import { useI18n } from "../../i18n/I18n";

interface IntelligenceWorkspaceProps {
  mission: MissionSession;
  showBelief: boolean;
  mapSelection: MapElementSelection | null;
  onMapSelectionChange: (selection: MapElementSelection | null) => void;
  onClose: () => void;
}

export function IntelligenceWorkspace({ mission, showBelief, mapSelection, onMapSelectionChange, onClose }: IntelligenceWorkspaceProps) {
  const { copy } = useI18n();
  return <TacticalWorkspace
    className="intelligence-workspace"
    leftPanel={<aside className="control-panel">
      <section className="panel-section">
        <div className="section-kicker">{copy.intelligence.kicker}</div>
        <h2>{copy.intelligence.title}</h2>
        <p className="hint">{copy.intelligence.hint}</p>
        <button className="primary-button return-network-button" onClick={onClose}>{copy.control.returnNetwork}</button>
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
      statusText={copy.intelligence.status}
    />}
    rightPanel={<aside className="telemetry-panel">
      <MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={onMapSelectionChange} defaultExpandedGroups />
      <DeploymentBriefingPanel title={copy.mission.counterDeployment} notes={mission.adaptationNotes} defaultExpanded />
    </aside>}
  />;
}
