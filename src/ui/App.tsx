import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useGameController } from "../game/useGameController";
import { CampaignMap } from "./CampaignMap";
import { useGameAudio } from "../audio/useGameAudio";
import f117SideSilhouette from "../assets/f117-side-silhouette.png";
import { getAdaptationAssessment } from "../domain/enemyAdaptation";
import { getIntelAccessTier } from "../domain/intelAccess";
import type { MissionDebrief } from "../domain/types";
import type { MapElementSelection } from "./mapSelection";
import { DebriefWorkspace } from "./workspaces/DebriefWorkspace";
import { IntelligenceWorkspace } from "./workspaces/IntelligenceWorkspace";
import { MissionWorkspace } from "./workspaces/MissionWorkspace";
import { GameplayGuide } from "./GameplayGuide";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "../i18n/I18n";

const workspaceViewStorageKey = "f117-tactical-command-system:view:v1";

function loadCampaignView(missionStatus: string | undefined): boolean {
  if (missionStatus === "RUNNING") return false;
  try {
    const savedView = localStorage.getItem(workspaceViewStorageKey);
    if (savedView === "TACTICAL") return false;
    if (savedView === "CAMPAIGN") return true;
  } catch {
    // 浏览器禁用存储时仍允许游戏正常启动。
  }
  return missionStatus === "PLANNING";
}

export function App() {
  const { copy } = useI18n();
  const { state, dispatch } = useGameController();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showBelief, setShowBelief] = useState(false);
  const [seedInput, setSeedInput] = useState(state.seed);
  const [campaignView, setCampaignView] = useState(() => loadCampaignView(state.currentMission?.status));
  const [intelligencePreview, setIntelligencePreview] = useState<typeof state.currentMission>();
  const [activeDebrief, setActiveDebrief] = useState<MissionDebrief>();
  const [mapSelection, setMapSelection] = useState<MapElementSelection | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideTriggerRef = useRef<HTMLButtonElement>(null);
  const mission = state.currentMission;
  const { muted, volume, setMuted, setVolume } = useGameAudio(mission);
  const intelAccessTier = getIntelAccessTier(state.campaign);
  const debugOverride = new URLSearchParams(window.location.search).get("ai-debug") === "1";
  const canUseAiDebug = debugOverride || intelAccessTier >= 2;
  const currentNodeId = state.campaign.currentNodeId;
  const currentDebrief = currentNodeId ? state.missionDebriefs[currentNodeId] : undefined;
  const closeGuide = useCallback(() => setGuideOpen(false), []);

  useEffect(() => {
    // 每次进入新的规划态（包括同节点重试）按权限恢复默认视图；任务内手动关闭后不再被 Tick 重置。
    if (mission?.status === "PLANNING") setShowBelief(intelAccessTier >= 2);
  }, [mission?.id, mission?.status, intelAccessTier]);
  useEffect(() => { if (mission?.status === "RUNNING") setCampaignView(false); }, [mission?.status]);
  useEffect(() => {
    try {
      localStorage.setItem(workspaceViewStorageKey, campaignView ? "CAMPAIGN" : "TACTICAL");
    } catch {
      // 视图偏好保存失败不影响任务进度自动保存。
    }
  }, [campaignView]);

  if (!mission) return <main className="fatal-state">{copy.app.fatalState}</main>;

  const closeDebrief = () => {
    if (activeDebrief && mission.status === "SUCCESS" && state.campaign.currentNodeId === activeDebrief.nodeId) {
      dispatch({ type: "RETURN_CAMPAIGN" });
    }
    setActiveDebrief(undefined);
    setCampaignView(true);
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark" aria-label={copy.app.aircraftSilhouette}><img className="brand-aircraft-silhouette" src={f117SideSilhouette} alt="" /></div>
        <div><h1>{copy.app.title}</h1><p>{copy.app.subtitle}</p></div>
      </div>
      <div className="topbar-controls">
        <LanguageSelector />
        <button ref={guideTriggerRef} type="button" className="guide-trigger" onClick={() => setGuideOpen(true)}>{copy.app.instructions}</button>
        <div className="audio-control">
          <button type="button" onClick={() => setMuted(!muted)}>{muted ? copy.app.soundOff : copy.app.soundOn}</button>
          <label htmlFor="master-volume">{copy.app.volume}</label>
          <input
            id="master-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            style={{ "--audio-volume": `${volume * 100}%` } as CSSProperties}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label={copy.app.volumeLabel}
          />
        </div>
        <form className="seed-control" onSubmit={(event) => {
          event.preventDefault();
          dispatch({ type: "NEW_RUN", seed: seedInput });
          setSelectedIndex(null);
          setActiveDebrief(undefined);
          setCampaignView(true);
        }}>
          <label htmlFor="run-seed">{copy.app.operationCode}</label>
          <input id="run-seed" value={seedInput} onChange={(event) => setSeedInput(event.target.value)} />
          <button type="submit">{copy.app.initializeNetwork}</button>
        </form>
      </div>
    </header>

    {activeDebrief
      ? <DebriefWorkspace debrief={activeDebrief} mapSelection={mapSelection} onMapSelectionChange={setMapSelection} onClose={closeDebrief} />
      : intelligencePreview
        ? <IntelligenceWorkspace mission={intelligencePreview} showBelief={intelAccessTier >= 2} mapSelection={mapSelection} onMapSelectionChange={setMapSelection} onClose={() => { setIntelligencePreview(undefined); setCampaignView(true); }} />
        : campaignView
          ? <CampaignMap state={state} dispatch={dispatch} onLaunch={() => setCampaignView(false)} onPreview={(preview) => { setIntelligencePreview(preview); setCampaignView(false); }} onDebrief={(debrief) => { setActiveDebrief(debrief); setCampaignView(false); }} />
          : <MissionWorkspace
            mission={mission}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            dispatch={dispatch}
            showBelief={showBelief}
            canUseAiDebug={canUseAiDebug}
            onToggleBelief={() => setShowBelief((value) => !value)}
            adaptationStatus={getAdaptationAssessment(state.enemyState.tacticalProfile).status}
            mapSelection={mapSelection}
            onMapSelectionChange={setMapSelection}
            onOpenCampaign={() => setCampaignView(true)}
            onReturnCampaign={() => setCampaignView(true)}
            onOpenDebrief={currentDebrief ? () => setActiveDebrief(currentDebrief) : undefined}
          />}
    <GameplayGuide open={guideOpen} onClose={closeGuide} triggerRef={guideTriggerRef} missionRunning={mission.status === "RUNNING"} />
  </main>;
}
