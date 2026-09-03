# 项目文档索引

## 设计提案与废案
`proposals/20260902112715-explore-remove-intel-quality.md` - 会话-119提出、会话-121采纳的“移除情报质量百分比、仅保留 INTEL 分级权限”设计来源；重新评估固定有限情报参数或回退方案时读取，最终实现以会话-121 workflow 为准。
`proposals/20260825225610-rejected-sigint-overlay.md` - 会话-80/81：已废弃的“有限情报动态 SIGINT Overlay”方案；重新讨论 AI DEBUG、直播观赏性或有限情报动态反馈时读取，不能视为已实施功能。

## 当前变更文档
`workflow/20260903172005-fix-tutorial-focus-after-mission-switch.md` - 会话-151：修复首次引导“选择首项任务”步骤在切换任务节点后仍沿用旧按钮坐标的问题，任务入口高亮框现在会观察预览内容变化并在布局完成后重新定位；排查情境引导与动态内容错位时读取。
`workflow/20260903153940-add-contextual-mission-tutorial.md` - 会话-150：增加运行在真实生成任务上的七步情境式任务引导，首次访问自动高亮任务网络、收益、规划、航线、确认与实时态势，路线步骤验证目标圈和最终撤离航点，完成偏好独立保存并可从操作说明重启；理解新手引导、页面衔接或教学与模拟边界时读取。
`workflow/20260903151325-increase-volume-label-spacing.md` - 会话-149：为顶部 `VOL / 音量` 标签增加独立左外边距，强化与声音开关的分组边界且保持滑杆侧间距不变；调整顶部声音区横向节奏时读取。
`workflow/20260903150838-square-volume-slider.md` - 会话-148：将顶部音量滑杆改为无圆角矩形轨道与直角等边菱形滑块，保留实时金色音量填充并兼容 WebKit/Firefox；调整声音控件视觉或排查音量填充时读取。
`workflow/20260903145938-align-extraction-label-font-size.md` - 会话-147：将撤离区标签由 `15px` 调整为与雷达、打击目标一致的 `12px`，保持几何居中与区域规则不变；调整地图标注字号层级时读取。
`workflow/20260903145431-resize-and-center-extraction-area.md` - 会话-146：保留原有限情报规划文案，将东北撤离区从 `(850, 30, 120×120)` 收缩并调整为 `(860, 50, 100×100)` 正方形，标签按几何中心绘制，旧存档自动迁移且雷达净空同步校准；核对撤离判定、地图顶部布局或旧存档区域时读取。
`workflow/20260903143622-compact-control-panel-buttons.md` - 会话-144：将任务左侧控制按钮与三列航点操作按钮收敛为 `11px` 单行文字，缩小横向留白并验证中英文均无溢出；调整任务侧栏按钮密度或排查文字换行时读取。
`workflow/20260903143058-use-corner-only-map-selection.md` - 会话-143：移除 Map Elements 选中态的额外虚线圆和虚线矩形，只保留外围四角实线呼吸闪烁，同时维持雷达情报圈与元素原始边界；调整地图选中层级或区分选择反馈与雷达情报时读取。
`workflow/20260903142149-refine-map-element-selection-highlight.md` - 会话-141：将地图元素选中主体轮廓改为精细虚线，并为点状与区域元素增加外围四角实线呼吸闪烁，动画仅在选中时运行且兼容减少动态效果偏好；调整地图选中反馈或排查 Canvas 动画时读取。
`workflow/20260903114841-split-design-and-mechanics-docs.md` - 会话-140：将 README 收敛为设计与开发入口、将机制手册设为精确规则唯一来源，补齐雷达与地图唯一数据，并新增完整英文 README 和英文机制手册；理解文档职责、维护双语规则或调整平衡文档时读取。
`workflow/20260903105407-add-extensible-language-selector.md` - 会话-136：将双语直接翻转按钮改为集中配置驱动的语言选择弹窗，显示当前语言并支持选中态、外部点击、Escape 与焦点恢复；扩展新语言或排查顶部语言交互时读取。
`workflow/20260903103030-align-topbar-control-heights.md` - 会话-135：将顶部语言、操作说明、声音、行动代码输入框和初始化按钮统一为 `30px` 高并精确对齐，保持音量滑杆原尺寸；排查顶部工具栏控件高度或垂直对齐时读取。
`workflow/20260903102239-tighten-campaign-preview-spacing.md` - 会话-134：移除任务预览段落统一的 `70px` 最小高度，改为内容自然撑高与 `14px` 固定段间距；排查任务预览文字纵向空白或段落节奏时读取。
`workflow/20260902234648-complete-chinese-interface-localization.md` - 会话-132：纠正中文模式保留英文系统术语的本地化边界，将任务类型、全域情报、敌方警戒、雷达接触、敌情推测、目标名称和内部态势完整中文化，并兼容旧复盘混排记录；排查中文界面英文残留或本地化术语边界时读取。
`workflow/20260902233326-restore-distinct-intel-reward-copy.md` - 会话-131：修复两次 INTEL 在任务网络初始状态下再次显示相同奖励的回归，分别呈现一级核实、二级授权条件、前序完成后的正式授权及错过前序后的一级补录；核对情报节点奖励文案与实际权限路线时读取。
`workflow/20260902232256-add-bilingual-game-interface.md` - 会话-129：为任务网络、三类战术工作区、Canvas 地图、天气、事件、操作说明与敌方内部状态建立完整中英文文案层，增加即时切换和独立偏好持久化，并兼容翻译旧复盘部署记录；排查界面文案、语言切换或本地化状态边界时读取。
`workflow/20260902230204-realign-game-design-documentation.md` - 会话-128：将 README 重构为完整游戏设计文档，校准机制手册与游戏内操作说明，补齐 Enemy Alert、天气预报时基和系统设计哲学，并修正 INTEL 动态奖励及核实雷达标识；理解当前完整设计、玩家说明和文档事实来源时优先读取。
`workflow/20260902170448-enforce-two-intel-mission-limit.md` - 会话-124：将“任务网络最多两个 INTEL 行动”设为集中式硬约束，生成器拒绝第三个 INTEL，权限派生复用同一上限，并明确错过首次行动将无法取得 `TOTAL INTEL`；扩展任务网络或核对情报上限时读取。
`workflow/20260902114838-distinguish-intel-reward-copy.md` - 会话-122：将第一次 INTEL 明确为核实全部雷达坐标与型号、第二次明确为授权 `TOTAL INTEL` 完整敌方态势，并通过动态派生兼容旧存档文案；核对任务网络 INTEL 奖励说明时读取。
`workflow/20260902113647-remove-continuous-intel-quality.md` - 会话-121：删除 `intelAccuracyBonus`、任务基础情报精度及相关 UI，改用 Seed 可复现的固定有限情报基线并保持两级 INTEL 权限，兼容剥离旧存档字段；核对有限情报参数、INTEL 奖励边界或存档兼容时读取。
`workflow/20260826225554-strike-scan-rate-and-system-docs.md` - 会话-115：将 STRIKE 改为累计降低所有后续雷达真实扫描速率，SEAD 改为只缩小覆盖并恢复最终火控增援，同时补齐任务、奖励、地图、雷达、天气和 OPERATION CODE 确定性生成文档；核对任务收益分工、扫描周期、Seed 复现或旧存档兼容时读取。
`workflow/20260826223103-balance-campaign-mission-effects.md` - 会话-112：为 STRIKE 增加累计最终战削弱，收敛 SEAD、加强 COMMAND STRIKE，将 Enemy Adaptation 改为画像特征与失败半权重驱动，并精简任务网络战略状态；核对任务收益、最终战构筑或敌方适应平衡时读取。
`workflow/20260826214504-rename-guide-to-operating-instructions.md` - 会话-107：纠正“作战简报”与通用帮助内容不匹配的问题，统一改为“操作说明 / OPERATING INSTRUCTIONS”；核对顶部帮助入口语义时读取。
`workflow/20260826213328-refine-operation-briefing-copy.md` - 会话-106：将游戏内“玩法说明”沉浸式改为“作战简报”，关闭按钮改为图标，仅在实时任务中显示持续执行提示，并补齐五类任务的战术价值；核对游戏内帮助文案时读取。
`workflow/20260826211925-add-developer-readme-and-gameplay-guide.md` - 会话-105：重写开发者 README、同步当前机制手册，并增加不暂停实时任务的顶部玩法说明弹窗；了解项目机制、开发边界或游戏内帮助入口时读取。
`workflow/20260826183457-unify-planning-task-copy.md` - 会话-103：将任务网络可执行入口与规划页面标题统一为“规划任务”，并将规划页入口改为统一黄色全宽“返回任务网络”；核对规划入口文案时读取。
`workflow/20260826182606-unify-task-entry-copy-and-separators.md` - 会话-102：将任务网络入口与页面标题统一为“预览任务/复盘任务”，统一黄色全宽返回按钮，并修复 THREAT WARNING 覆盖底部分割线为红色的问题；排查任务入口文案或侧栏分割线时读取。
`workflow/20260826174932-share-tactical-workspace-components.md` - 会话-99：在保留任务执行、任务情报与任务复盘独立布局的前提下，抽取三栏工作区、地图舞台、天气预报、部署简报及敌方分析基础组件，并将三个页面迁出 App；排查战术 UI 组件职责或减少页面重复时读取。
`workflow/20260826153450-realtime-route-and-mission-debrief.md` - 会话-95：移除任务暂停与执行中退出，允许实时编辑当前目标后的航点，并持久化成功撤离快照供任务视角/全景双视角复盘；核对任务执行权限、旧存档迁移或历史复盘时读取。
`workflow/20260826073500-add-tiered-intel-preview.md` - 会话-85：增加两级 INTEL 可见权限、二级完整 AI DEBUG 奖励及锁定节点当前研判地图预览；核对情报成长、地图预览或调试解锁时读取。
`workflow/20260825185403-optimize-tactical-sidebars.md` - 会话-76：移除航点菱形锁定标记，按规划/态势职责重组左右侧栏，将天气预报迁移到左侧，并为地图元素和 AI 调试建立分级折叠；排查战术界面信息密度或侧栏职责时读取。
`workflow/20260821231636-fix-empty-event-inner-grid.md` - 会话-73：修正会话-72 对空事件 Grid 层级的误判，将空事件条目自身改为整行块布局；排查“等待操作事件…”仍在 `50px` 内换行时读取。
`workflow/20260821231225-fix-briefing-list-width.md` - 会话-72：拆分结构化事件两列布局与简报单列布局，修复反制部署、最终防御简报及空事件提示只占 `50px` 第一列的问题；排查侧栏列表异常换行或大块空白时读取。
`workflow/20260821230030-redesign-objective-and-route-distance.md` - 会话-70：重构目标代号/状态/距离/武器信息层级，目标摧毁后显示撤离区最近边界距离，并增加规划总航程与当前剩余航程；核对目标模块或航线长度计算时读取。
`workflow/20260821223622-adjust-mission-network-copy-and-restore-route-hint.md` - 会话-68：将 Campaign 标题与字段统一为“任务网络 / 任务代号 / 预估雷达数量”，并恢复航点编辑操作提示；核对任务网络术语或航点帮助文案时读取。
`workflow/20260821173217-refine-immersive-military-copy.md` - 会话-67：按“解谜 + 动态规划军事模拟”定位全量精简玩家文案，删除机制说明、教程和生成元信息，将关键规划数据改写为军事态势语言；审查玩家界面措辞或沉浸边界时读取。
`workflow/20260821154914-enable-github-pages-on-first-deploy.md` - 会话-65：根据首次 Actions 失败日志，让工作流自动启用以 GitHub Actions 为来源的 Pages；排查 Pages 初次部署 404 或 `configure-pages` 失败时读取。
`workflow/20260821095356-map-panel-progress-save-and-pages.md` - 会话-64：增加可点击定位的完整地图元素面板、飞行中航点按钮禁用、本地任务/战役自动存档与安全恢复，并配置 GitHub Pages 自动发布；核对地图图例交互、刷新恢复或在线部署时读取。
`workflow/20260821093646-show-failed-node-and-allow-retry.md` - 会话-63：失败后当前节点显示 FAILED 但仍可重新执行，同层备选保持 AVAILABLE、下一层锁定，并默认选中刚失败节点；核对失败状态展示或重试入口时读取。
`workflow/20260821092211-allow-retry-after-aircraft-loss.md` - 会话-62：将飞机损失改为只结束当前 Mission，返回 Campaign 后可重试或改选，并兼容旧 FAILED+DEFEAT 状态；核对导弹命中结算或失败重玩时读取。本规则取代会话-51的“飞机损失终止 Run”。
`workflow/20260821090609-style-contacts-by-radar-type.md` - 会话-60：让 Contact 估算圈按雷达类型使用浅金黄/浅橙/浅红并减半线宽，保持 CMD 强红色不变；核对 AI DEBUG Contact 来源辨识或视觉层级时读取。
`workflow/20260821085204-require-success-to-advance-campaign.md` - 会话-57：统一 Mission 与 Campaign 成功口径，只有摧毁目标并撤离才推进；普通失败只增加 Enemy Alert 并保留当前层供重试或改选。核对失败结算或节点解锁规则时读取。
`workflow/20260821082517-heal-stale-defeat-on-campaign-screen.md` - 会话-55：根据截图修复已停留 Campaign 页面时 C1-0 COMPLETED、C2 AVAILABLE 仍错显 Run 结束的问题，并在选择 C2 时自愈旧状态；排查热更新残留状态或按钮错误禁用时读取。
`workflow/20260821081745-recover-active-run-after-sead-success.md` - 会话-54：修复 C1-0 SEAD 已完成后因陈旧 DEFEAT 导致 C2 错显“飞机损失”的问题；核对成功任务结算、Run 状态不变量或 C2 无法执行时读取。
`workflow/20260821080659-stop-campaign-after-aircraft-loss.md` - 会话-51：修复飞机损失导致 Run DEFEAT 后仍按普通失败解锁下一层的问题；排查 Campaign 终止状态、后续节点误解锁或 SEAD 后显示 Run 结束时读取。
`workflow/20260821075929-enforce-extraction-radar-clearance.md` - 会话-49：禁止初始、适应性及 Final Strike 雷达中心进入撤离区周围 80 u，同时保留探测覆盖；核对撤离区公平性或雷达最终部署约束时读取。
`workflow/20260821073449-fix-campaign-edge-alignment.md` - 会话-46：统一任务方块百分比定位与 SVG 连线的横纵缩放规则，修复大屏任务网络虚线脱节；排查 Campaign 响应式布局或节点连线对齐时读取。
`workflow/20260820223709-ensure-target-fire-control-coverage.md` - 会话-43：保证至少一部 Fire Control 完整覆盖目标攻击区并保留 20 u 余量，且保护唯一目标区火控不被适应系统移位；核对目标防御、SEAD 后覆盖或雷达重部署时读取。
`workflow/20260820214842-add-radar-types.md` - 会话-34：增加 Early Warning、Acquisition、Fire Control 三类真实雷达，差异接入覆盖、扫描、波束、Contact 精度和火控贡献；核对分层防空、雷达生成或类型平衡时读取。
`workflow/20260820213439-sync-realtime-meters.md` - 会话-32：移除 Fuel、Threat 与 Awareness 高频仪表的宽度过渡，修复持续 Tick 时视觉进度滞后于数据；排查进度条暂停后突变或不增长时读取。
`workflow/20260820212200-weather-flight-slowdown.md` - 会话-31：为 Cloud/Fog/Rain/Storm 增加 10%–30% 分级飞行减速，重叠取最强效果并保持按距离扣油；核对天气战术代价、有效速度或燃油关系时读取。
`workflow/20260820204645-add-f117-fuel-range.md` - 会话-29：增加 2000 u 满油航程、按实际飞行距离扣油、耗尽失败与燃油遥测告警；核对航线成本、自动驾驶累计距离或任务失败原因时读取。
`workflow/20260820174641-split-dynamic-weather-and-forecast.md` - 会话-25：重新拆分静态 Terrain 与动态 Weather Cell，增加四种天气的可复现时空演化及 T+30/60/90 有误差预报；核对天气 Tick、探测影响、预报 UI 或 Seed 复现时读取。
`workflow/20260820104300-unify-detection-zones-and-adaptation.md` - 会话-10 第三批：统一地形/天气探测修正区，改用真实轨迹分析 Enemy Adaptation，并按空间距离选择反制雷达；核对环境判定或敌方画像时读取。
`workflow/20260820104259-simplify-campaign-choices.md` - 会话-10 第二批：合并同质任务类型，将 Campaign 改为三个顺序二选一阶段并在选择后关闭同层节点；核对战役解锁或持久效果时读取。
`workflow/20260820104258-clean-redundant-state-and-events.md` - 会话-10 第一批：限制事件历史、隐藏正常视图内部日志，并删除未消费或可派生状态；排查事件音频、状态边界或普通/调试信息隔离时读取。
`workflow/20260819225946-document-commander-personality-design.md` - 会话-64：在 `TODO.md` 中记录旧版 Commander Doctrine、当前中性 Commander，以及未来三种可读防空指挥风格和验收条件；评估或恢复指挥官性格时读取。
`workflow/20260819222015-collapsible-sidebars-and-scrollbars.md` - 会话-61：为左右侧栏及内部长列表定制终端风格滚动条，并为航点、遥测、事件、战役简报和 AI Debug 长内容增加独立折叠；排查侧栏溢出、滚动条或折叠交互时读取。
`workflow/20260819220914-reset-current-campaign-mission.md` - 会话-60：修复“重置任务”误重建整个 Run 的问题；重置现在保留当前战役节点、Campaign 进度、资源与敌方持久状态，并重新应用当前节点生成规则；排查任务重置或节点跳转异常时读取。
`workflow/20260819153738-use-top-silhouette-on-map.md` - 会话-6：使用 `f117-top-silhouette.png` 替换地图中的简化三角飞机符号，并按实时航向旋转；核对地图飞机图标加载、尺寸或方向时读取。
`workflow/20260819152458-update-brand-subtitle.md` - 会话-5：将顶部品牌副标题由阶段说明替换为 `FROM USA AIR FORCE // VERSION 1.0`；核对品牌副标题或版本文案时读取。
`workflow/20260819150830-use-brand-image-directly.md` - 会话-4：直接使用用户更新后的 `f117-side-silhouette.png`，移除 SVG 颜色矩阵及所有图像效果；核对顶部品牌图标渲染方式时读取。
`workflow/20260819145249-use-reference-f117-brand-icon.md` - 会话-3：使用 `.temp/image copy 2.png` 的原始 F-117 侧面轮廓替换手绘 SVG，并通过 SVG 亮度滤镜统一呈现金色、移除白底；核对顶部品牌图标来源、比例或颜色时读取。
`workflow/20260819144506-rename-game-and-update-brand-icon.md` - 会话-2：游戏更名为 F-117 Tactical Command System（F-117 战术指挥系统），并将左上角 ZR 菱形标记替换为 F-117 侧面矢量剪影；核对品牌名称或顶部图标时读取。
`workflow/20260819090321-add-game-audio.md` - 会话-48：新增 Web Audio 合成音效、事件映射、锁定/导弹循环警报、静音和音量控制；排查音效触发或循环清理时读取。
`workflow/20260819084340-halve-aircraft-speed.md` - 会话-41：将飞机基础速度从 7.2 u/s 减半为 3.6 u/s；核对任务节奏或飞行耗时时读取。
`workflow/20260819083706-remove-strike-position-search.md` - 会话-40：删除投弹后的目标区集中搜索与定位回退，恢复“投弹只提高 Awareness、方位只来自 Belief/CMD”；核对警戒值时期搜索方式时读取。
`workflow/20260819082423-restore-awareness-without-silence.md` - 会话-39：恢复 Awareness 作为 Commander 搜索强度输入，同时保持雷达静默、网络静默和 Doctrine 已删除；区分警戒值与跟踪进度时读取。
`workflow/20260819080320-simplify-core-radar-loop.md` - 会话-36：保留 Contact、Belief/CMD、Commander 与三种雷达搜索，删除静默、Doctrine、Awareness 和机体损伤层；理解当前核心雷达与单次命中失败规则时读取。
`workflow/20260819073234-remove-redundant-systems.md` - 会话-33：统一情报质量资源，移除失活 Reward/Build、虚假 Contact、空 EventBus、接触容忍与固定武器计数；排查系统冗余或追踪简化边界时读取。
`workflow/20260819063213-strengthen-radar-network-coordination.md` - 会话-28：强化跨雷达 Contact 共享、联合火控、Commander 响应延迟与搜索方位误差；理解多雷达协同和 Command Strike 实际价值时读取。
`workflow/20260819053551-contain-ui-scroll-in-viewport.md` - 会话-17：固定根节点与应用外壳到视口，禁止全局滚动并让左右面板、Campaign 各自内部滚动；排查 UI 溢出或滚动边界时读取。
`workflow/20260819052414-fix-ai-debug-map-resize.md` - 会话-16：固定战术工作区高度并让左右面板独立滚动，修复切换 AI DEBUG 导致地图缩放变化；排查地图尺寸或三栏布局时读取。
`workflow/20260818233840-optimize-belief-heatmap-opacity.md` - 会话-14：让 Belief 热力图按绝对概率和有效状态缩放透明度；需要追踪失联残余色块变暗与隐藏逻辑时读取。
`workflow/20260818232259-optimize-cmd-belief-positioning.md` - 会话-10：优化 Belief 速度估计、边界传播、失联失效与 CMD 平滑定位；需要追踪敌方位置推测和地图边缘伪定位修复时读取。
`../README.md` - 中文设计与开发入口；需要理解设计哲学、系统关系、代码架构和扩展边界时读取，不作为可变平衡数值来源。
`../README.en.md` - 与中文 README 职责一致的英文设计与开发入口；向英文开发者介绍项目时读取。
`../docs/game-mechanics.md` - 中文精确规则、数值、阈值和状态转换的唯一文档来源；核对任务、雷达、天气、指挥、交战、生成或平衡规则时读取。
`../docs/game-mechanics.en.md` - 与中文机制手册对齐的英文精确规则来源；向英文玩家或开发者解释当前规则时读取。
`workflow/20260818143124-rename-project-directory.md` - 会话-1：初始化项目认知文档，并将项目目录由 `f117-simulator` 更名为 `f117-nighthawk-route`；需要追溯项目命名与目录初始化时读取。
`workflow/20260818151940-phase-0-1-route-planning.md` - 会话-1：建立 ZERO RETURN Web 工程、Roguelike 状态边界与战术航线规划原型；需要了解当前架构、交互、测试和 Phase 边界时读取。
`workflow/20260818153427-phase-2-radar-simulation.md` - 会话-14：实现 Phase 2 雷达扫描、动态探测概率、地形遮蔽和误差 Contact；需要了解 Sensor/AI 数据边界与雷达参数时读取。
`workflow/20260818154945-phase-3-radar-operator-ai.md` - 会话-19：实现 Phase 3 Radar Operator Utility AI、四种搜索模式和评分调试；需要了解雷达行为决策与 Contact 记忆时读取。
`workflow/20260818155716-phase-4-belief-map.md` - 会话-24：实现 Phase 4 Belief Map 概率融合、扩散衰减和调试热力图；需要了解敌方位置认知模型时读取。
`workflow/20260818160825-phase-5-awareness-commander.md` - 会话-28：实现 Phase 5 Enemy Awareness、Air Defense Commander 与雷达协调；需要了解任务警戒和防空指挥决策时读取。
`workflow/20260818161626-phase-6-single-mission-loop.md` - 会话-33：实现 Phase 6 目标攻击、撤离、胜负与 Mission History；需要了解单任务完整循环与验收方式时读取。
`workflow/20260818162233-phase-7-procedural-mission.md` - 会话-37：实现 Phase 7 Seed 程序生成 Mission、天气探测与 Doctrine；需要了解任务生成规则和复现方法时读取。
`workflow/20260818163716-phase-8-campaign-map.md` - 会话-42：实现 Phase 8 Campaign Map、任务预览、节点解锁和持久 SEAD 效果；需要了解 Run 战略路线时读取。
`workflow/20260818165517-phase-9-player-build.md` - 会话-49：实现 Phase 9 Tactical Modules、三选一奖励和 Ghost/Intelligence/Deception Build；需要了解模块效果与奖励流程时读取。
`workflow/20260818170254-clear-reward-pool.md` - 会话-57：按产品方向清空当前奖励池并保留扩展框架；需要确认当前核心玩法和奖励状态时优先读取。
`workflow/20260818170712-phase-10-persistent-effects.md` - 会话-61：深化 Phase 10 跨任务情报、防空覆盖、Alert 与指挥链效果；需要理解 Campaign 如何重构后续防空体系时读取。
`workflow/20260818172730-limited-radar-intelligence.md` - 会话-68：让情报精度实际控制雷达发现率与估计误差，并拆分玩家视图和 AI DEBUG；需要理解有限情报边界与地图显示规则时读取。
`workflow/20260818174200-game-mechanics-manual.md` - 会话-76：新增完整游戏机制手册并修正 README 过时描述；需要追溯机制文档结构与入口调整时读取。
`workflow/20260818194100-phase-11-enemy-adaptation.md` - 会话-79：实现基于已执行航线历史的玩家画像与后续雷达反制部署；需要理解 Enemy Adaptation 数据边界和反制规则时读取。
`workflow/20260818195200-phase-12-final-strike.md` - 会话-84：实现基于完整 Campaign 历史动态组装的 Final Strike 防空体系；需要理解最终战增援、Doctrine 与历史结算规则时读取。
`workflow/20260818200200-slower-flight-auto-strike.md` - 会话-88：将飞行速度降至十分之一并改为进入攻击范围自动投弹；需要理解当前飞行节奏与攻击触发规则时读取。
`workflow/20260818202500-air-defense-engagement.md` - 会话-94：实现可逆的跟踪、锁定、导弹、脱锁、持久损伤与 Run 失败链路；需要理解路线风险和防空交战规则时读取。

## 关键记忆
- 项目名称为 `F-117 Tactical Command System`，中文名为 `F-117 战术指挥系统`，包名为 `f117-tactical-command-system`。
- 产品定位是解谜与动态规划导向的军事模拟；任务界面只呈现态势、情报、告警和指令，不直接解释幕后游戏机制、操作教程或程序生成信息。
- 当前完成 Phase 0–12，采用 React、TypeScript、Vite 与 HTML Canvas。
- 游戏界面全部玩家可见文案支持简体中文与 English 即时切换；语言偏好独立于 Run 存档，React 与 Canvas 共用同一文案目录，切换不影响 Seed、Tick 或任何模拟状态。
- `RunState` 与 `MissionSession` 分离，Canvas 不持有领域状态。
- 只有 Radar Sensor 可读取飞机真实状态，后续 AI 只能消费带误差 Radar Contact。
- 雷达网络由 Early Warning、Acquisition、Fire Control 三类组成，类型分别影响覆盖、扫描周期、波束、探测概率、Contact 精度和火控贡献。
- 每场任务最终至少一部 Fire Control 完整覆盖目标攻击区并保留 20 u 余量；唯一目标区火控雷达不参与 Enemy Adaptation 移位。
- Radar Operator 基于本地或指挥链允许的共享 Contact 计算 Utility 评分，不共享真实飞机信息；活动 Contact 最长保留 8 秒。
- Belief Map 仅消费 Contact，以 24×24 网格保存概率分布并进行运动传播、扩散和衰减。
- Commander 只读取 Awareness、Belief 与雷达状态，通过 Utility 偏置协调各 Radar Operator；投弹只提高警戒，不提供目标区定位，网络静默仍已移除。
- 单 Mission 已形成 Plan → Infiltrate → Strike → High-alert Extraction → Result 闭环。
- Mission 的静态地形、动态天气初始参数与演化、天气预报、雷达和目标均由 Seed 确定生成；有限雷达情报按固定规则和逐雷达子 Seed 生成，相同任务时间可复现相同真实天气。
- 天气预报是任务创建时生成的绝对时刻 `T+30/60/90s` 快照，不是滚动预报；执行到对应时刻后过期条目与轮廓隐藏。
- 任务网络固定为三个顺序二选一阶段与 Final Strike；只有摧毁目标并成功撤离才推进并关闭同层选择；所有失败都把当前节点标记为可重试的 `FAILED`、增加 Enemy Alert，同层备选保持 `AVAILABLE`，下一层保持锁定。
- Tactical Reward 与 Player Build 已完整移除；成功或失败后任务停留在冻结结果页，由玩家手动返回任务网络结算。
- 当前 Roguelike 差异集中在程序生成地图、雷达网络、天气与任务网络防空构建。
- Intel 只保留两级权限成长，不再维护连续情报质量；STRIKE 每次使所有后续雷达扫描速率乘以 90%；SEAD 只将后续雷达覆盖乘以 90%，不阻止最终火控增援；Command Strike 将 Commander 协调乘以 65%；所有成功任务使 Enemy Alert 增加 2，失败增加 10。
- 默认战术地图只呈现玩家侧雷达情报；敌方真实雷达、Contact、Belief、Awareness 和 Utility 仅在 `TOTAL INTEL`、全景复盘或开发调试视图中呈现。
- Enemy Alert 是 `0–100` 的跨任务持久警戒，成功增加 2、失败增加 10，后续基础雷达范围乘以 `1 + Alert / 250`，且 Final Strike 在 Alert ≥ 15 时追加警戒雷达；它不等于单任务 Awareness 或 THREAT WARNING。
- Enemy Adaptation 仅分析按位移采样的真实已飞轨迹，成功与失败分别按 1.0/0.5 权重更新画像；地形利用、南北航路及直达倾向达到阈值后才触发 22%–42% 的空间反制部署。
- Final Strike 固定部署目标区后备火控，并综合 STRIKE 扫描削弱、SEAD 覆盖削弱、Command Strike、情报任务、Enemy Alert 与画像特征动态生成最终防空体系；自适应增援要求累计观察权重至少为 2 且形成两项以上显著特征。
- 飞机基础速度为 `3.6 u/s`，运行中进入目标攻击半径后自动投弹，无需玩家手动操作。
- F-117 满油航程为 `2000 u`，按真实累计飞行距离消耗；燃油耗尽会停止飞机并令当前任务失败。
- Weather Cell 会令飞机减速 10%–30%，多个天气重叠时只取最强效果；天气延长暴露时间但不额外增加单位距离油耗。
- 连续 Contact 会累积跟踪并触发导弹；切断新证据可以脱锁，导弹命中会摧毁飞机并结束当前 Mission，但不会结束 Run。
- Run、任务网络、Mission、成功复盘与当前工作区视图保存在浏览器本地；运行中的存档刷新后继续执行，旧版 `PAUSED` 存档迁移为 `RUNNING`。
- 右侧 `MAP ELEMENTS` 可说明并高亮地图元素，普通模式下雷达定位仍严格使用有限情报。
- Mission Generator 没有严格的路径可达性或数学可通关证明，只保证撤离区雷达净空和目标区最低 Fire Control 覆盖等局部约束。
- `main` 分支通过 GitHub Actions 自动发布 GitHub Pages 在线版本。
- 检索时先读取本索引，再按需读取具体 workflow 文档。
