# 中文界面系统术语完整本地化

## 背景与目标

- 会话-129把 `INTEL`、`SEAD`、`TOTAL INTEL`、`Contact`、`Belief` 等术语错误地定义为中英文界面共用代号。
- 中文模式因此出现大段中英混排，尤其集中在操作说明、INTEL 奖励、全域情报和敌方内部态势。
- 本次将所有玩家可见的任务类型与系统术语完整中文化，同时继续保留真正用于识别的品牌、编号、坐标和计量单位。

## 约束与原则

- 不修改领域枚举、Seed、存档、任务收益或模拟逻辑。
- 中文界面保留 `F-117`、语言入口 `EN`、节点/雷达/天气/航点编号、坐标轴与计量单位。
- 英文界面继续使用原英文术语；两套目录结构必须一致。
- 兼容旧复盘快照中已经保存的中英混排部署记录。

## 阶段与 TODO

- [x] 清理中文文案目录中的英文任务与系统术语。
- [x] 本地化顶部品牌、页面标题、目标名称、时间单位与 Canvas 指挥目标。
- [x] 本地化雷达操作员和 Commander 效用缩写。
- [x] 兼容翻译旧部署记录，并让新部署记录使用完整中文。
- [x] 增加中文术语残留扫描和组件回归测试。
- [x] 更新 README、机制手册、AGENTS.md 与文档索引。
- [x] 完成自动化测试、生产构建和真实浏览器检查。

## 代码变更

### `src/i18n/I18n.tsx`

```diff
       lost: "失联",
       countUnit: "个",
-      taskTimePrefix: "任务 T+",
+      secondsUnit: "秒",
+      taskTimePrefix: "任务时刻 +",
+      targetName: "指挥掩体",
       sentencePeriod: "。",
     },
     app: {
+      documentTitle: "F-117 战术指挥系统",
+      title: "F-117 战术指挥系统",
+      subtitle: "源自美国空军 // 版本 1.0",
@@
-        INTEL_2: "二级情报授权：开放 TOTAL INTEL 真实雷达覆盖与完整敌方态势",
-        INTEL_2_CONDITIONAL: "二级情报候选：完成前序 INTEL 后授权 TOTAL INTEL；若前序缺失则降为一级情报核实",
-        INTEL_2_RECOVERY: "一级情报补录：核实全部雷达坐标与型号；本次任务网络无法再授权 TOTAL INTEL",
+        INTEL_2: "二级情报授权：开放全域情报，显示真实雷达覆盖与完整敌方态势",
+        INTEL_2_CONDITIONAL: "二级情报候选：完成前序情报行动后授权全域情报；若前序缺失则降为一级情报核实",
+        INTEL_2_RECOVERY: "一级情报补录：核实全部雷达坐标与型号；本次任务网络无法再授权全域情报",
@@
-        ["有限情报", "初始报告可能遗漏雷达，坐标与覆盖也存在误差。第一次完成 INTEL 将补齐全部雷达并核实坐标和型号；第二次授权 TOTAL INTEL。若放弃首次 INTEL，本次行动将无法取得第二级权限。"],
-        ["任务效果", "STRIKE 降低后续雷达扫描速率；SEAD 缩小覆盖；COMMAND STRIKE 削弱协同搜索和联合跟踪；INTEL 改变可见信息，不强化飞机。"],
-        ["敌方响应", "ENEMY ALERT 会在每次任务后上升，失败造成的增幅更大并扩大后续雷达范围；敌方还会根据已飞航迹调整后续部署。"],
-        ["环境与航程", "地形和恶劣天气可降低探测概率，但天气也会降低飞行速度。燃油按实际飞行距离消耗，出动前预报以任务 T+30/60/90 秒为固定时刻。"],
-        ["生存规则", "THREAT WARNING 表示当前跟踪与火控威胁。利用转向、距离、地形和天气切断新 Contact；导弹来袭后必须尽快脱离持续照射。"],
+        ["有限情报", "初始报告可能遗漏雷达，坐标与覆盖也存在误差。第一次完成情报行动将补齐全部雷达并核实坐标和型号；第二次授权全域情报。若放弃首次情报行动，本次行动将无法取得第二级权限。"],
+        ["任务效果", "打击任务降低后续雷达扫描速率；防空压制缩小覆盖；指挥打击削弱协同搜索和联合跟踪；情报行动改变可见信息，不强化飞机。"],
+        ["敌方响应", "敌方警戒会在每次任务后上升，失败造成的增幅更大并扩大后续雷达范围；敌方还会根据已飞航迹调整后续部署。"],
+        ["环境与航程", "地形和恶劣天气可降低探测概率，但天气也会降低飞行速度。燃油按实际飞行距离消耗，出动前预报对应任务开始后第 30、60、90 秒。"],
+        ["生存规则", "威胁告警表示当前跟踪与火控威胁。利用转向、距离、地形和天气切断新的雷达接触；导弹来袭后必须尽快脱离持续照射。"],
@@
-      radarOperatorAi: "雷达操作员 AI",
+      radarOperatorAi: "雷达操作员决策",
       utility: "效用值",
-      totalIntelOn: "TOTAL INTEL 开启",
-      totalIntelOff: "TOTAL INTEL 关闭",
+      totalIntelOn: "全域情报开启",
+      totalIntelOff: "全域情报关闭",
@@
-      realRadarContact: "真实雷达 / 敌方 Contact",
+      realRadarContact: "真实雷达 / 敌方接触点",
@@
-      activeContact: "有效 Contact",
-      beliefPeak: "Belief 峰值",
+      activeContact: "有效接触点",
+      beliefPeak: "推测概率峰值",
@@
       radarCount: "雷达数量",
       estimatedPosition: "推测位置",
+      operatorUtilityShort: { wide: "广", sector: "扇", focus: "跟" },
+      commanderUtilityShort: { monitor: "监", coordinate: "协", focus: "集" },
@@
       destroyed: "已摧毁",
       terrainMasking: "地形遮蔽",
+      commandTarget: "指挥目标",
@@
       lost: "LOST",
       countUnit: "",
+      secondsUnit: "s",
       taskTimePrefix: "MISSION T+",
+      targetName: "COMMAND BUNKER",
       sentencePeriod: ".",
     },
     app: {
+      documentTitle: "F-117 Tactical Command System",
+      title: "F-117 TACTICAL COMMAND SYSTEM",
+      subtitle: "FROM USA AIR FORCE // VERSION 1.0",
@@
       radarCount: "RADAR COUNT",
       estimatedPosition: "ESTIMATED POSITION",
+      operatorUtilityShort: { wide: "W", sector: "S", focus: "F" },
+      commanderUtilityShort: { monitor: "M", coordinate: "C", focus: "F" },
@@
       destroyed: "DESTROYED",
       terrainMasking: "TERRAIN MASKING",
+      commandTarget: "CMD",
@@
   useEffect(() => {
     document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
+    document.title = localeCatalogs[language].app.documentTitle;
@@
 export function localizeBriefingNote(note: string, language: Language): string {
-  if (language === "zh") return note;
+  if (language === "zh") {
+    const chineseCompatibilityNotes: Record<string, string> = {
+      "低 Enemy Alert：未触发警戒增援": "敌方警戒较低：未触发警戒增援",
+      "Command Strike 战果削弱最终指挥链": "指挥打击战果削弱最终指挥链",
+    };
+    if (chineseCompatibilityNotes[note]) return chineseCompatibilityNotes[note];
+    const alertMatch = note.match(/^Enemy Alert (\d+)：增援警戒雷达部署$/);
+    return alertMatch ? `敌方警戒 ${alertMatch[1]}：增援警戒雷达部署` : note;
+  }
@@
     "低 Enemy Alert：未触发警戒增援": "Low ENEMY ALERT: no surveillance reinforcement deployed",
+    "敌方警戒较低：未触发警戒增援": "Low ENEMY ALERT: no surveillance reinforcement deployed",
@@
     "Command Strike 战果削弱最终指挥链": "COMMAND STRIKE effects have degraded the final command chain",
+    "指挥打击战果削弱最终指挥链": "COMMAND STRIKE effects have degraded the final command chain",
@@
-  const alertMatch = note.match(/^Enemy Alert (\d+)：增援警戒雷达部署$/);
+  const alertMatch = note.match(/^(?:Enemy Alert|敌方警戒) (\d+)：增援警戒雷达部署$/);
```

### `src/domain/campaignBalance.ts`

```diff
-  if (key === "INTEL_2") return "授权 TOTAL INTEL，开放真实雷达覆盖与完整敌方态势";
-  if (key === "INTEL_2_CONDITIONAL") return "完成前序 INTEL 后授权 TOTAL INTEL；若前序缺失则降为一级情报核实";
-  if (key === "INTEL_2_RECOVERY") return "补录一级情报，核实全部雷达坐标与型号；本次任务网络无法再授权 TOTAL INTEL";
+  if (key === "INTEL_2") return "授权全域情报，开放真实雷达覆盖与完整敌方态势";
+  if (key === "INTEL_2_CONDITIONAL") return "完成前序情报行动后授权全域情报；若前序缺失则降为一级情报核实";
+  if (key === "INTEL_2_RECOVERY") return "补录一级情报，核实全部雷达坐标与型号；本次任务网络无法再授权全域情报";
```

### `src/domain/finalStrike.ts`

```diff
-    notes.push(`Enemy Alert ${context.enemyAlert}：增援警戒雷达部署`);
+    notes.push(`敌方警戒 ${context.enemyAlert}：增援警戒雷达部署`);
   } else {
-    notes.push("低 Enemy Alert：未触发警戒增援");
+    notes.push("敌方警戒较低：未触发警戒增援");
@@
-  if (completed.has("COMMAND_STRIKE")) notes.push("Command Strike 战果削弱最终指挥链");
+  if (completed.has("COMMAND_STRIKE")) notes.push("指挥打击战果削弱最终指挥链");
```

### `src/ui/App.tsx`

```diff
-        <div><h1>F-117 TACTICAL COMMAND SYSTEM</h1><p>FROM USA AIR FORCE // VERSION 1.0</p></div>
+        <div><h1>{copy.app.title}</h1><p>{copy.app.subtitle}</p></div>
```

### `src/ui/ControlPanel.tsx`

```diff
-        <div className="section-heading"><span>{copy.control.targetDesignation}</span><span>{mission.target.id}</span></div>
+        <div className="section-heading"><span>{copy.control.targetDesignation}</span><span>{copy.common.targetName}</span></div>
@@
-        meta={`${mission.route.waypoints.length - 1} NAV`}
+        meta={formatWaypointCount(mission.route.waypoints.length - 1, copy.common.countUnit)}
@@
+function formatWaypointCount(value: number, countUnit: string): string {
+  return countUnit ? `${value} ${countUnit}` : `${value} NAV`;
+}
```

### `src/ui/MapElementPanel.tsx`

```diff
-            <strong>{mission.target.id}</strong><span>{copy.mapElements.targetDetail} {mission.target.attackRadius} u</span>
+            <strong>{copy.common.targetName}</strong><span>{copy.mapElements.targetDetail} {mission.target.attackRadius} u</span>
```

### `src/ui/WeatherForecastPanel.tsx`

```diff
-        <strong>{forecast.weatherId} / {copy.common.taskTimePrefix}{forecast.horizonSeconds}s</strong>
+        <strong>{forecast.weatherId} / {copy.common.taskTimePrefix}{forecast.horizonSeconds}{copy.common.secondsUnit}</strong>
```

### `src/ui/TacticalMap.tsx`

```diff
-        context.fillText(`${copy.common.taskTimePrefix}${forecast.horizonSeconds} ${copy.enums.weatherKind[forecast.kind]}`, forecast.estimatedPosition.x + 5, forecast.estimatedPosition.y + 12);
+        context.fillText(`${copy.common.taskTimePrefix}${forecast.horizonSeconds}${copy.common.secondsUnit} ${copy.enums.weatherKind[forecast.kind]}`, forecast.estimatedPosition.x + 5, forecast.estimatedPosition.y + 12);
@@
-        context.fillText("CMD", target.x + 22, target.y - 18);
+        context.fillText(copy.canvas.commandTarget, target.x + 22, target.y - 18);
```

### `src/ui/EnemySystemPanels.tsx`

```diff
-      <span>W {radar.operator.utilityScores.WIDE_SEARCH.toFixed(0)}</span>
-      <span>S {radar.operator.utilityScores.SECTOR_SEARCH.toFixed(0)}</span>
-      <span>F {radar.operator.utilityScores.FOCUSED_TRACK.toFixed(0)}</span>
+      <span>{copy.enemy.operatorUtilityShort.wide} {radar.operator.utilityScores.WIDE_SEARCH.toFixed(0)}</span>
+      <span>{copy.enemy.operatorUtilityShort.sector} {radar.operator.utilityScores.SECTOR_SEARCH.toFixed(0)}</span>
+      <span>{copy.enemy.operatorUtilityShort.focus} {radar.operator.utilityScores.FOCUSED_TRACK.toFixed(0)}</span>
```

### `src/ui/workspaces/MissionWorkspace.tsx`

```diff
-          ? <p className="threat-message">{copy.mission.impactCountdown} {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} s // {copy.mission.evade}</p>
+          ? <p className="threat-message">{copy.mission.impactCountdown} {mission.engagement.missileTimeRemainingSeconds?.toFixed(1)} {copy.common.secondsUnit} // {copy.mission.evade}</p>
@@
-        <div><dt>{copy.mission.flightTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div><div><dt>{copy.mission.coordinates}</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
+        <div><dt>{copy.mission.flightTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} {copy.common.secondsUnit}</dd></div><div><dt>{copy.mission.coordinates}</dt><dd>{mission.aircraft.position.x.toFixed(1)}, {mission.aircraft.position.y.toFixed(1)}</dd></div>
@@
-          <div className="score-grid commander-scores"><span>M {mission.commander.utilityScores.MONITOR.toFixed(0)}</span><span>C {mission.commander.utilityScores.COORDINATED_SEARCH.toFixed(0)}</span><span>F {mission.commander.utilityScores.CONCENTRATE_SEARCH.toFixed(0)}</span></div>
+          <div className="score-grid commander-scores"><span>{copy.enemy.commanderUtilityShort.monitor} {mission.commander.utilityScores.MONITOR.toFixed(0)}</span><span>{copy.enemy.commanderUtilityShort.coordinate} {mission.commander.utilityScores.COORDINATED_SEARCH.toFixed(0)}</span><span>{copy.enemy.commanderUtilityShort.focus} {mission.commander.utilityScores.CONCENTRATE_SEARCH.toFixed(0)}</span></div>
```

### `src/ui/workspaces/DebriefWorkspace.tsx`

```diff
-          <div><dt>{copy.debrief.missionTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} s</dd></div>
+          <div><dt>{copy.debrief.missionTime}</dt><dd>{(mission.elapsedMs / 1000).toFixed(1)} {copy.common.secondsUnit}</dd></div>
```

### `src/i18n/I18n.test.tsx`

```diff
     const untranslatedEnglish = collectStrings(localeCatalogs.en)
       .filter(([path, value]) => path !== "app.languageButton" && /[\u3400-\u9fff]/u.test(value));
     expect(untranslatedEnglish).toEqual([]);
+    const untranslatedChineseTerms = collectStrings(localeCatalogs.zh)
+      .filter(([, value]) => /\b(?:INTEL|SEAD|STRIKE|TOTAL|CONTACT|BELIEF|COMMANDER|AI|CMD|NAV|MISSION)\b/iu.test(value));
+    expect(untranslatedChineseTerms).toEqual([]);
@@
     expect(screen.getByText("任务网络")).toBeInTheDocument();
+    expect(document.title).toBe("F-117 战术指挥系统");
@@
     expect(document.documentElement.lang).toBe("en");
+    expect(document.title).toBe("F-117 Tactical Command System");
@@
+    expect(localizeBriefingNote("低 Enemy Alert：未触发警戒增援", "zh")).toBe(
+      "敌方警戒较低：未触发警戒增援",
+    );
+    expect(localizeBriefingNote("Enemy Alert 22：增援警戒雷达部署", "zh")).toBe(
+      "敌方警戒 22：增援警戒雷达部署",
+    );
@@
       "低 Enemy Alert：未触发警戒增援",
+      "敌方警戒较低：未触发警戒增援",
@@
       "Command Strike 战果削弱最终指挥链",
+      "指挥打击战果削弱最终指挥链",
@@
       "Enemy Alert 22：增援警戒雷达部署",
+      "敌方警戒 22：增援警戒雷达部署",
```

### `src/procedural/campaignGenerator.test.ts`

```diff
-      "完成前序 INTEL 后授权 TOTAL INTEL；若前序缺失则降为一级情报核实",
+      "完成前序情报行动后授权全域情报；若前序缺失则降为一级情报核实",
```

### `src/ui/CampaignMap.copy.test.tsx`

```diff
-    expect(screen.getByText("二级情报候选：完成前序 INTEL 后授权 TOTAL INTEL；若前序缺失则降为一级情报核实。")).toBeInTheDocument();
+    expect(screen.getByText("二级情报候选：完成前序情报行动后授权全域情报；若前序缺失则降为一级情报核实。")).toBeInTheDocument();
@@
-    expect(screen.getByText("二级情报授权：开放 TOTAL INTEL 真实雷达覆盖与完整敌方态势。")).toBeInTheDocument();
+    expect(screen.getByText("二级情报授权：开放全域情报，显示真实雷达覆盖与完整敌方态势。")).toBeInTheDocument();
@@
-    expect(screen.getByText("一级情报补录：核实全部雷达坐标与型号；本次任务网络无法再授权 TOTAL INTEL。")).toBeInTheDocument();
+    expect(screen.getByText("一级情报补录：核实全部雷达坐标与型号；本次任务网络无法再授权全域情报。")).toBeInTheDocument();
```

### `src/ui/GameplayGuide.test.tsx`

```diff
-    expect(screen.getByText(/STRIKE 降低后续雷达扫描速率/)).toBeInTheDocument();
-    expect(screen.getByText(/若放弃首次 INTEL/)).toBeInTheDocument();
-    expect(screen.getByText(/ENEMY ALERT 会在每次任务后上升/)).toBeInTheDocument();
+    expect(screen.getByText(/打击任务降低后续雷达扫描速率/)).toBeInTheDocument();
+    expect(screen.getByText(/若放弃首次情报行动/)).toBeInTheDocument();
+    expect(screen.getByText(/敌方警戒会在每次任务后上升/)).toBeInTheDocument();
```

### `src/ui/SharedTacticalPanels.test.tsx`

```diff
-    expect(screen.queryByText(/任务 T\+30s/)).not.toBeInTheDocument();
-    expect(screen.getAllByText(/任务 T\+(60|90)s/)).toHaveLength(mission.weather.length * 2);
+    expect(screen.queryByText(/任务时刻 \+30秒/)).not.toBeInTheDocument();
+    expect(screen.getAllByText(/任务时刻 \+(60|90)秒/)).toHaveLength(mission.weather.length * 2);
@@
-  it("Radar Operator 列表统一显示模式与三项 Utility", () => {
+  it("雷达操作员列表在中文模式显示三项中文效用缩写", () => {
@@
-    expect(screen.getAllByText(/^W /)).toHaveLength(mission.radars.length);
-    expect(screen.getAllByText(/^S /)).toHaveLength(mission.radars.length);
-    expect(screen.getAllByText(/^F /)).toHaveLength(mission.radars.length);
+    expect(screen.getAllByText(/^广 /)).toHaveLength(mission.radars.length);
+    expect(screen.getAllByText(/^扇 /)).toHaveLength(mission.radars.length);
+    expect(screen.getAllByText(/^跟 /)).toHaveLength(mission.radars.length);
```

### `src/ui/ControlPanel.test.tsx`

```diff
     expect(screen.getByRole("button", { name: "返回任务网络" })).toHaveClass("primary-button", "return-network-button");
+    expect(screen.getByText("指挥掩体")).toBeInTheDocument();
+    expect(screen.getByRole("button", { name: /航点序列/ })).toHaveTextContent("0 个");
```

### `src/ui/MapElementPanel.test.tsx`

```diff
     fireEvent.click(screen.getByRole("button", { name: /任务目标/ }));
+    expect(screen.getByText("指挥掩体")).toBeInTheDocument();
@@
     expect(screen.getByRole("button", { name: /^ENVIRONMENT/ })).toBeInTheDocument();
+    expect(screen.getByText("COMMAND BUNKER")).toBeInTheDocument();
```

### `README.md`

```diff
 顶部语言按钮可在简体中文与 English 之间即时切换。任务网络、三类战术工作区、Canvas 地图、操作说明、状态枚举、事件、天气与敌方内部面板都从同一文案目录渲染；切换语言只改变表达层，不会 dispatch 游戏 Action，也不会重置任务、暂停 Tick、改变 Seed 或修改探测结果。
 
+中文模式使用完整中文任务与系统术语，不混排 `INTEL`、`SEAD`、`TOTAL INTEL`、`Contact`、`Belief` 等英文名称；这些内部枚举只存在于代码和开发文档。界面仅保留 `F-117`、任务/雷达/天气/航点编号、坐标轴及计量单位等必要识别符。
+
 语言偏好使用独立的 `localStorage` 键保存，不进入 `RunState`、`MissionSession` 或复盘快照。旧存档中已经冻结的中文部署记录会在英文界面显示时经过兼容映射，因此复盘历史任务不会残留中文动态简报。
```

### `docs/game-mechanics.md`

```diff
-- `TOTAL INTEL`、Contact、Belief、Commander、SEAD 等系统代号在两种语言中保留，周边状态和解释文字随语言切换。
+- 中文界面将任务类型与系统术语完整显示为中文，例如“情报行动、防空压制、全域情报、雷达接触、敌情推测和敌方警戒”；英文界面显示对应英文术语。只保留 `F-117`、节点/雷达/航点编号、坐标轴和计量单位等识别符。
```

### `AGENTS.md`

```diff
-- 游戏内全部玩家可见文案支持简体中文与 English 即时切换；语言偏好独立保存，不进入 `RunState`、`MissionSession`、Seed 或复盘快照，Canvas 与 React 必须消费同一语言目录且切换不得改变模拟状态。
+- 游戏内全部玩家可见文案支持简体中文与 English 即时切换；中文界面的任务类型与系统术语必须完整中文化，仅保留 `F-117`、任务/雷达/天气/航点编号、坐标轴和计量单位等必要识别符。语言偏好独立保存，不进入 `RunState`、`MissionSession`、Seed 或复盘快照，Canvas 与 React 必须消费同一语言目录且切换不得改变模拟状态。
```

## 测试用例

### TC-001 中文目录英文术语扫描

- 操作：递归扫描中文文案目录。
- 预期：不存在 INTEL、SEAD、STRIKE、TOTAL、CONTACT、BELIEF、COMMANDER、AI、CMD、NAV、MISSION 等系统术语。
- 是否通过：是。

### TC-002 中文任务网络与操作说明

- 操作：真实浏览器切换至中文，检查任务网络、第二个情报节点和操作说明。
- 预期：任务类型、奖励、状态、任务效果和敌方响应均使用中文；只剩必要识别符。
- 是否通过：是。

### TC-003 旧复盘部署记录兼容

- 操作：分别以中文和英文渲染旧版 `Enemy Alert`、`Command Strike` 混排记录，以及新版纯中文记录。
- 预期：中文无英文系统术语，英文无中文残留。
- 是否通过：是。

### TC-004 标题与动态界面

- 操作：切换语言并检查浏览器标题、品牌、目标名称、天气时刻、Canvas 指挥目标和敌方效用缩写。
- 预期：全部随当前语言切换，模拟状态不变。
- 是否通过：是。

## 验证结果

- `npm run typecheck`：通过。
- `npm run test -- --run`：通过，29 个测试文件、141 项测试全部成功。
- `npm run build`：通过，Vite 生产构建成功。
- `git diff --check`：通过。
- 真实浏览器：中文任务网络、第二情报节点和操作说明检查通过，浏览器标题为“F-117 战术指挥系统”。

