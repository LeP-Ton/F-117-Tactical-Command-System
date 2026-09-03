import { getWeatherSpeedFactor } from "../../domain/weatherSystem";
import type { MissionSession } from "../../domain/types";
import type { GameAction } from "../../game/gameReducer";
import { CollapsibleSection } from "../CollapsibleSection";
import { ControlPanel } from "../ControlPanel";
import { DeploymentBriefingPanel } from "../DeploymentBriefingPanel";
import { EnemyStateSummary, RadarOperatorList } from "../EnemySystemPanels";
import { MapElementPanel } from "../MapElementPanel";
import type { MapElementSelection } from "../mapSelection";
import { TacticalMapStage } from "../TacticalMapStage";
import { TacticalWorkspace } from "../TacticalWorkspace";
import { useI18n } from "../../i18n/I18n";

interface MissionWorkspaceProps {
  mission: MissionSession;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  dispatch: (action: GameAction) => void;
  showBelief: boolean;
  canUseAiDebug: boolean;
  onToggleBelief: () => void;
  adaptationStatus: "LOW" | "ACTIVE" | "HIGH";
  mapSelection: MapElementSelection | null;
  onMapSelectionChange: (selection: MapElementSelection | null) => void;
  onOpenCampaign: () => void;
  onReturnCampaign: () => void;
  onOpenDebrief?: () => void;
}

export function MissionWorkspace(props: MissionWorkspaceProps) {
  const { copy } = useI18n();
  const { mission, selectedIndex, onSelect, dispatch, showBelief, canUseAiDebug, onToggleBelief, adaptationStatus, mapSelection, onMapSelectionChange } = props;
  const activeWaypoint = mission.route.waypoints[mission.route.activeWaypointIndex];
  const recentEvents = mission.events.slice(-5).reverse();
  const visibleRadarIntel = mission.radarIntel.filter((report) => report.level !== "UNKNOWN");
  const weatherSpeedFactor = getWeatherSpeedFactor(mission.aircraft.position, mission.weather);

  return <TacticalWorkspace
    leftPanel={<ControlPanel mission={mission} selectedIndex={selectedIndex} onSelect={onSelect} dispatch={dispatch} onOpenCampaign={props.onOpenCampaign} onReturnCampaign={props.onReturnCampaign} onOpenDebrief={props.onOpenDebrief} />}
    mapStage={<TacticalMapStage
      variant="MISSION"
      mission={mission}
      showBelief={showBelief}
      selectedIndex={selectedIndex}
      onSelect={onSelect}
      dispatch={dispatch}
      mapSelection={mapSelection}
      toolbar={canUseAiDebug ? <button className={`belief-toggle ${showBelief ? "active" : ""}`} onClick={onToggleBelief}>{showBelief ? copy.mission.totalIntelOn : copy.mission.totalIntelOff}</button> : undefined}
    />}
    rightPanel={<aside className="telemetry-panel">
      <section className={`panel-section threat-section threat-${mission.engagement.stage.toLowerCase()}`}>
        <div className="section-heading"><span>{copy.mission.threatWarning}</span><span>{copy.enums.threatStage[mission.engagement.stage]}</span></div>
        <div className="threat-progress"><i style={{ width: `${mission.engagement.trackProgress}%` }} /></div>
        {mission.engagement.stage === "MISSILE_INBOUND"
          ? <p className="threat-message">{copy.mission.impactCountdown} {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} {copy.common.secondsUnit} // {copy.mission.evade}</p>
          : <p className="threat-message">{copy.mission.radiationThreat} {mission.engagement.trackProgress.toFixed(0)}%</p>}
      </section>
      <section className={`panel-section fuel-section ${mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity <= 0.2 ? "fuel-critical" : ""}`}>
        <div className="section-heading"><span>{copy.mission.fuelRange}</span><span>{(mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100).toFixed(0)}%</span></div>
        <div className="fuel-meter"><i style={{ width: `${mission.aircraft.fuelRemaining / mission.aircraft.fuelCapacity * 100}%` }} /></div>
        <p className="threat-message">{copy.mission.availableRange} {mission.aircraft.fuelRemaining.toFixed(0)} u</p>
      </section>
      <CollapsibleSection title={copy.mission.flightStatus}><dl className="telemetry-grid">
        <div><dt>{copy.mission.flightTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} {copy.common.secondsUnit}</dd></div><div><dt>{copy.mission.coordinates}</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
        <div><dt>{copy.mission.heading}</dt><dd>{mission.aircraft.headingDegrees.toFixed(0)}°</dd></div><div><dt>{copy.mission.speed}</dt><dd>{mission.aircraft.speed.toFixed(2)} u/s</dd></div>
        <div><dt>{copy.mission.weatherSpeedLoss}</dt><dd>{weatherSpeedFactor < 1 ? `${((1 - weatherSpeedFactor) * 100).toFixed(0)}%` : copy.common.none}</dd></div><div><dt>{copy.mission.currentWaypoint}</dt><dd>{activeWaypoint ? `WP-${mission.route.activeWaypointIndex}` : "—"}</dd></div>
      </dl></CollapsibleSection>
      <CollapsibleSection title={copy.mission.missionIntel} defaultExpanded={false}><dl className="telemetry-grid">
        <div><dt>{copy.mission.knownRadarIntel}</dt><dd>{formatCount(visibleRadarIntel.length, copy.common.countUnit)}</dd></div>
        <div><dt>{copy.mission.unlocatedSignals}</dt><dd>{formatCount(mission.radarIntel.length - visibleRadarIntel.length, copy.common.countUnit)}</dd></div><div><dt>{copy.mission.adaptationStatus}</dt><dd>{copy.enums.adaptationStatus[adaptationStatus]}</dd></div>
        <div><dt>{copy.mission.radarScanRate}</dt><dd>{(mission.radarScanRateModifier * 100).toFixed(0)}%</dd></div>
      </dl></CollapsibleSection>
      <MapElementPanel mission={mission} showBelief={showBelief} selection={mapSelection} onSelectionChange={onMapSelectionChange} />
      <DeploymentBriefingPanel title={copy.mission.counterDeployment} notes={mission.adaptationNotes} />
      <DeploymentBriefingPanel title={copy.mission.finalDefenseBriefing} notes={mission.finalStrikeNotes} meta={mission.radars.length} />
      {showBelief && <CollapsibleSection className="debug-group" title={copy.mission.enemySystemState} meta={copy.mission.internal} defaultExpanded={false}>
        <CollapsibleSection className="event-section" title={copy.mission.structuredEvents} meta={mission.events.length}><ol className="event-list">
          {recentEvents.length === 0 && <li className="empty-event">{copy.mission.waitingEvents}</li>}
          {recentEvents.map((event) => <li key={event.id}><time>{(event.timestamp / 1000).toFixed(1).padStart(5, "0")}</time><span>{copy.enums.eventType[event.type]}</span></li>)}
        </ol></CollapsibleSection>
        <CollapsibleSection className="commander-section" title={copy.mission.airDefenseCommander} meta={`${copy.mission.alert} ${mission.awareness.value.toFixed(0)}%`}>
          <EnemyStateSummary mission={mission} density="detailed" />
          <div className="commander-intent">{copy.enums.commanderIntent[mission.commander.intent]}</div>
          <div className="score-grid commander-scores"><span>{copy.enemy.commanderUtilityShort.monitor} {mission.commander.utilityScores.MONITOR.toFixed(0)}</span><span>{copy.enemy.commanderUtilityShort.coordinate} {mission.commander.utilityScores.COORDINATED_SEARCH.toFixed(0)}</span><span>{copy.enemy.commanderUtilityShort.focus} {mission.commander.utilityScores.CONCENTRATE_SEARCH.toFixed(0)}</span></div>
          <div className="awareness-meter"><i style={{ width: `${mission.awareness.value}%` }} /></div>
        </CollapsibleSection>
        <CollapsibleSection className="operator-section" title={copy.mission.radarOperatorAi} meta={copy.mission.utility}><RadarOperatorList mission={mission} /></CollapsibleSection>
      </CollapsibleSection>}
    </aside>}
  />;
}

function formatCount(value: number, unit: string): string {
  return unit ? `${value} ${unit}` : String(value);
}
