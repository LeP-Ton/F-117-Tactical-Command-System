import { gameConfig } from "../config/gameConfig";
import { SeededRandom } from "../core/SeededRandom";
import { createRadarOperatorState } from "./radarOperatorAI";
import type { MissionNodeType, MissionSession, PlayerTacticalProfile, RadarState } from "./types";

export interface FinalStrikeContext {
  completedNodeTypes: MissionNodeType[];
  enemyAlert: number;
  tacticalProfile: PlayerTacticalProfile;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createGuardRadar(
  id: string,
  x: number,
  y: number,
  range: number,
  sweepAngleDegrees: number,
): RadarState {
  return {
    id,
    position: {
      x: clamp(x, 90, gameConfig.world.width - 90),
      y: clamp(y, 90, gameConfig.world.height - 90),
    },
    range,
    sweepAngleDegrees,
    scanAccumulatorSeconds: 0,
    scanCount: 0,
    operator: createRadarOperatorState(),
  };
}

/** 根据整个 Campaign 的既成结果组装最终防空体系。 */
export function applyFinalStrikeDefense(
  mission: MissionSession,
  context: FinalStrikeContext,
): MissionSession {
  const completed = new Set(context.completedNodeTypes);
  const random = new SeededRandom(`${mission.seed}:FINAL-DEFENSE`);
  const averageRange = mission.radars.reduce((sum, radar) => sum + radar.range, 0)
    / Math.max(1, mission.radars.length);
  const radars = [...mission.radars];
  const notes: string[] = ["最终目标启用分层防空戒备"];

  if (completed.has("SEAD")) {
    notes.push("SEAD 战果阻止目标区后备雷达上线");
  } else {
    const angle = random.range(0, Math.PI * 2);
    radars.push(createGuardRadar(
      "FINAL-GUARD",
      mission.target.position.x + Math.cos(angle) * 145,
      mission.target.position.y + Math.sin(angle) * 145,
      averageRange * 0.92,
      random.range(0, 360),
    ));
    notes.push("未执行 SEAD：目标区后备雷达上线");
  }

  if (context.enemyAlert >= 15) {
    radars.push(createGuardRadar(
      "ALERT-GUARD",
      mission.target.position.x - 185,
      mission.target.position.y + 165,
      averageRange * (1 + Math.min(0.18, context.enemyAlert / 500)),
      random.range(0, 360),
    ));
    notes.push(`Enemy Alert ${context.enemyAlert}：增援警戒雷达部署`);
  } else {
    notes.push("低 Enemy Alert：未触发警戒增援");
  }

  if (context.tacticalProfile.missionSamples >= 2) {
    const corridorY = context.tacticalProfile.southernRouteBias * gameConfig.world.height;
    radars.push(createGuardRadar(
      "ADAPT-GUARD",
      gameConfig.world.width * 0.64,
      corridorY,
      averageRange * 0.86,
      random.range(0, 360),
    ));
    notes.push(`${context.tacticalProfile.southernRouteBias > 0.5 ? "南部" : "北部"}历史航路部署自适应截击雷达`);
  }

  if (completed.has("COMMAND_STRIKE")) notes.push("Command Strike 战果削弱最终指挥链");
  if (completed.has("INTEL")) notes.push("情报战果提高最终目标雷达识别质量");

  return {
    ...mission,
    radars,
    finalStrikeNotes: notes,
  };
}
