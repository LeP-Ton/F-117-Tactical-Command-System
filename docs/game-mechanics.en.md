# F-117 Tactical Command System — Game Mechanics Manual

[简体中文](game-mechanics.md) | [English](game-mechanics.en.md)

This is the sole documentation source for exact rules, values, thresholds, and state transitions in the current version. See [README.en.md](../README.en.md) for design goals, system philosophy, architecture boundaries, and extension principles. Implemented changes and code diffs are recorded under `.agentdocs/workflow/`.

## 1. Objective

The core game is planning and dynamically revising an F-117 route under incomplete air-defense intelligence. It is not a reward-build system that upgrades the aircraft.

A mission follows this sequence:

1. Enter Plan Mission from the mission network, then add, drag, and reorder waypoints on the tactical map.
2. After confirmation, the aircraft follows the route continuously. A running mission cannot be paused, reset, or abandoned for the mission network.
3. New waypoints may be added during flight, and legs beyond the current target waypoint may be changed. The current target and flown route cannot be edited.
4. Entering the target's attack radius releases the weapon automatically without another confirmation.
5. After destroying the target, reach the extraction zone in the northeast.

Base aircraft speed is `3.6 u/s`. Full fuel provides `2000 u` of travel, equal to two sides of the current `1000×1000` map. Fuel consumption uses actual accumulated movement, so turns and multi-waypoint paths are not undercounted as a straight line between frame endpoints. If remaining fuel cannot cover a complete Tick, the aircraft moves only to the end of its remaining range. Fuel exhaustion outside extraction fails the mission.

The Operating Instructions can be opened at any time. They are an overlay above the terminal and do not pause a live mission. When opened during flight, “MISSION IN PROGRESS // OPERATION CONTINUES” means aircraft, radar, and engagement simulation continue to advance.

Success requires both a destroyed target and entry into the extraction zone. A route that ends with the target intact, a destroyed target without extraction, mid-route fuel exhaustion, or aircraft loss is a failure. `FUEL RANGE` shows the remaining percentage and available distance; below 20% it enters the red warning state.

## 2. What the Player Can See

### 2.1 Normal View: Limited Intelligence

The normal tactical map is a pre-mission intelligence picture, not the true enemy state:

- Yellow diamond: estimated radar position, not guaranteed to be the real coordinate.
- Yellow uncertainty circle: the area in which the real radar may be located; a smaller circle means better intelligence.
- Yellow dashed coverage circle: estimated detection range, which can be larger or smaller than the real range.
- `CONFIRMED`: position or identity has been verified. Coverage appears only when the report contains a reliable range estimate.
- `PROBABLE`: reasonably credible intelligence with an estimated position and coverage.
- `POSSIBLE`: low-confidence intelligence with a position estimate but no reliable coverage estimate.
- Unlocated signal: a radar may exist, but there is not enough information to place it on the map.

Radar reports are generated when the mission is prepared. They do not reveal current radar heading or operator action. The current model has no radar shutdown state; every radar continues to scan.

### 2.2 Fixed Limited-Intelligence Baseline

Before any INTEL mission is completed, reports use one fixed baseline:

- Each real radar has a deterministic 90% probability of being located. Omitted radars contribute only to the unlocated-signal count.
- Located radars have a `50–70 u` position-error radius.
- Range estimates differ from real range by `±8%`.
- Confidence is 60%–88% and maps to `CONFIRMED / PROBABLE / POSSIBLE`; `POSSIBLE` has no range estimate.

These baseline values do not improve per mission. Each radar uses an independent `<Mission Seed>:INTEL:<Radar ID>` stream, so the same Seed and Run history reproduce the same report. The game no longer stores or displays a continuous intelligence-quality percentage. All persistent INTEL value comes from the discrete access levels below.

In the current implementation, a located report identifies the real radar type. The first INTEL reward therefore fills radar omissions, removes position error, and changes the type to verified status; it does not modify actual radar capability.

### 2.3 TOTAL INTEL and Development Debug Access

Full enemy-system visibility is also a formal mission-network reward. One completed INTEL mission reveals all subsequent radars and verifies their coordinates and types. A second completed INTEL mission authorizes `TOTAL INTEL`, which defaults to ON when entering later missions and may be turned OFF. Development builds and the explicit `?ai-debug=1` query parameter bypass mission-network access requirements.

When enabled, the view shows:

- Real radar locations, real ranges, and live scan lines.
- Radar types and current Operator modes.
- Radar Contacts held by the enemy.
- The enemy Belief Map.
- Commander intent, target, and Utility scores.
- W/S/F Utility scores for each operator and the effective command-link value.

The switch changes presentation only. It is not persisted as mission state and cannot alter detection, Commander behavior, engagement, or settlement.

### 2.4 Interface Language

All player-facing copy supports Simplified Chinese and English, including the mission network, plan/run/preview/debrief workspaces, Operating Instructions, Canvas labels, weather forecasts, state labels, structured events, and enemy-system panels.

- The language button displays the current language and opens a selection popover. Candidate languages are rendered from one centralized configuration so more languages can be added without rewriting a two-language toggle.
- The popover closes after selection, by outside click, or with `Escape`. Language may be changed during any mission phase.
- The preference uses a dedicated browser `localStorage` key.
- Language is not part of `RunState`, `MissionSession`, a Seed, or a debrief and has no effect on Tick, audio, radar detection, or settlement.
- Domain-generated briefing records retain stable persisted values; the English renderer includes compatibility translations for older Chinese records.
- The Chinese UI translates mission types and system terminology completely. Only identifiers such as `F-117`, node/radar/weather/waypoint IDs, axes, and units remain language-neutral.

## 3. Radar Detection

Being inside a coverage circle does not guarantee detection. A scan calculates non-zero probability only when the beam passes the aircraft direction:

- Distance: detection generally becomes easier closer to the radar; outside real range it is impossible.
- Beam: the aircraft must be inside the current beam.
- Aspect: nose-on or tail-on exposure is safer than broadside exposure.
- Terrain: terrain masking reduces probability while the aircraft is inside a terrain zone.
- Terrain and weather are separate systems. Terrain is static; Weather Cells move and change size, intensity, and type over mission time.
- Cloud, Rain, Storm, and Fog all reduce detection probability. Storm is generally strongest. Multipliers from overlapping zones are multiplied.

The exact per-scan probability is:

```text
min(0.95,
  0.46
  × radar-type detection multiplier
  × max(0, 1 - (distance / real range)^1.7)
  × (0.38 + sin²(angular difference between aircraft heading and bearing to radar) × 0.92)
  × product of intersecting terrain multipliers
  × product of intersecting weather multipliers
  × beam-hit factor
)
```

The beam-hit factor is either `0` or `1`. Outside real range or outside the current beam, probability is zero.

### 3.1 Dynamic Weather and Forecasts

- A Weather Cell's initial type, position, size, velocity, intensity, evolution phase, and period are Seed-driven.
- Current weather is a pure function of initial parameters and absolute mission time, independent of frame rate. Time does not advance during planning and advances continuously after launch.
- Weather wraps across map boundaries and evolves through `Cloud → Rain → Storm → Rain → Fog`.
- Effective aircraft speed is reduced by Cloud 10%, Fog 15%, Rain 20%, or Storm 30%. Overlap uses only the strongest speed penalty rather than multiplying penalties.
- Slower speed increases exposure time and mission duration. Fuel still follows distance traveled, so weather does not directly increase range consumption.
- Mission preparation creates fixed-horizon forecasts for absolute mission times `T+30/60/90s`. They are measured from mission start, not recalculated as rolling horizons from the current time.
- `WEATHER FORECAST` shows type, strengthening/stable/weakening trend, and confidence. A forecast and its map outline disappear after the corresponding mission time passes.
- Forecast position and scale include Seed-driven error. More distant horizons have greater error and lower confidence, so forecasts support tactical judgment rather than exposing future truth.

A scan line passing the aircraft without producing a Contact is a normal probability outcome. Entering a coverage circle is not immediate exposure.

### 3.2 Radar Types and Layered Air Defense

Every normal mission contains at least one radar of each type:

| Type | Base range | Sensor interval | Wide-search speed | Beam | Detection | Contact accuracy | Engagement quality |
|---|---:|---:|---:|---:|---:|---:|---:|
| Early Warning | 380–470 u | 0.40 s | 28°/s | 36° | 0.82× | 0.72× | 0.55× |
| Acquisition | 270–360 u | 0.25 s | 38°/s | 24° | 1.00× | 1.00× | 1.00× |
| Fire Control | 180–260 u | 0.16 s | 52°/s | 12° | 1.18× | 1.35× | 1.50× |

Early Warning can create cues at long range across a wide angular area but is inefficient at quickly completing the fire-control chain alone. Fire Control must point its narrow beam correctly, then builds high-quality tracking rapidly after consecutive hits. Acquisition sits between them and can help cue Fire Control through shared Contacts.

Final Strike reinforcements use the same roles: target-area `FINAL-GUARD` is Fire Control, Enemy Alert `ALERT-GUARD` is Early Warning, and historical-route `ADAPT-GUARD` is Acquisition.

STRIKE reduces the global scan rate in later missions. The multiplier applies to Wide Search rotation, Sector Search oscillation, and actual Sensor frequency. One STRIKE gives 90% rate and two give 81%. Effective Sensor interval is `base interval / scan rate`, so the reward changes real detection cadence as well as animation. It does not alter per-scan range, beam width, probability multiplier, or Contact accuracy.

### 3.3 Target-Area Fire-Control Coverage

After generation and all mission-network modifiers, at least one Fire Control radar must fully cover the target attack area:

```text
distance from Fire Control to target center + target attack radius
≤ real Fire Control range - 20 u
```

If the existing deployment fails this condition, only the Fire Control nearest the target is moved, preserving its Seed-generated relative bearing. This check runs after SEAD range reduction, Enemy Adaptation movement, and Final Strike reinforcement. Enemy Adaptation cannot move the sole Fire Control responsible for target defense.

Full coverage only guarantees that an attacking aircraft is inside one Fire Control radar's real range. Narrow beams, probability, aircraft aspect, terrain, and weather still determine whether consecutive Contacts occur.

## 4. Radar Contact and Enemy Knowledge

A successful detection does not give the enemy the aircraft's real coordinate. It creates an imperfect `Radar Contact`:

- A Contact contains estimated position, confidence, signal strength, and error radius.
- Better detection conditions generally produce higher confidence and lower error.
- Contacts remain active for 8 seconds, then leave the active list.
- An Operator prioritizes its local Contact and, while the command link permits, may consume a recent Contact shared by another radar.
- Belief and Commander cannot read the real aircraft position.

Two types of yellow visualization must not be confused:

- Yellow regions in normal view are the player's pre-mission intelligence about enemy radars.
- Contact circles near the aircraft under `TOTAL INTEL` are the enemy's estimate of the player aircraft.

Their information directions are opposite.

## 5. Radar Operator Actions

Every radar recalculates the Utility of three actions every 0.5 seconds. The highest score becomes its mode. Scores use local Contact evidence plus Commander bias.

### 5.1 WIDE_SEARCH

- Behavior: continuous 360° rotation.
- Favored when there is no recent Contact or Commander requests routine monitoring.
- Meaning: watches every direction without holding a suspicious bearing.
- Player response: assess overlapping coverage and use distance, terrain, and weather to reduce the chance of each sweep succeeding.

### 5.2 SECTOR_SEARCH

- Behavior: oscillates approximately ±42° around the newest Contact or Commander-assigned bearing.
- Favored when an active Contact exists within the last 8 seconds but evidence is insufficient for focused tracking; coordinated-search orders also raise its score.
- Meaning: sacrifices other directions to revisit one suspicious sector.
- Player response: do not continue on the enemy's last predicted line. Turn, enter masking, or leave the sector to reduce reacquisition.

### 5.3 FOCUSED_TRACK

- Behavior: points directly at the estimated bearing of the newest Contact.
- Favored by a high-confidence Contact within 4.5 seconds or a high-alert Commander concentrate-search order.
- Meaning: the enemy is inspecting a predicted position, but still aims at imperfect Contact/Belief rather than aircraft truth.
- Player response: change the previous heading quickly and use terrain or weather to break consecutive hits. Continuing along the predicted line is the highest-risk response.

## 6. Air-Defense Engagement and Survival Pressure

Consecutive Radar Contacts accumulate track quality from 0 to 100 and produce player-visible warning stages:

- `UNDETECTED`: no anomaly detected.
- `SUSPECTED`: track quality reaches 16.
- `TRACKED`: reaches 42 and sustained illumination is present.
- `LOCKED`: reaches 72 and a fire-control lock is established.
- `MISSILE_INBOUND`: reaches 100 and launches a missile.

Contact confidence and signal strength determine evidence strength. The strongest Contact represents one radar's local fire-control contribution and is not reduced by command-link damage. Additional radar evidence forms a joint track through the command link, so lower coordination reduces the acceleration created by simultaneous detection. With no new Contact, track quality decays by 14 per second. Turning, leaving coverage, or entering terrain or weather can therefore break a lock by preventing new evidence.

A launched missile has an 8-second flight time. If track quality drops below 32 during the countdown, guidance is lost and the missile is defeated. If guidance remains at the end of the countdown, the aircraft is hit. There is no second random hit roll.

A hit destroys the aircraft and fails the current mission without terminating the Run. Back on the mission network, the node is `FAILED` but retryable, its same-stage alternative remains `AVAILABLE`, and the next stage remains locked.

Normal-view `THREAT WARNING` shows stage, emission-threat progress, and missile countdown. It is actionable onboard warning and does not require `TOTAL INTEL`.

### 6.1 Cockpit Audio

Domain events trigger synthesized audio:

- Radar Contact: short electronic cue with high-frequency repeat limiting.
- Awareness stage increase: two-tone caution.
- Fire-control lock: looping lock warning.
- Missile inbound: faster looping warning.
- Guidance break: descending release cue.
- Automatic release and target explosion: low-frequency impact and noise.
- Mission success or failure: corresponding result cue.

`SOUND ON/OFF` controls mute and `VOL` controls master volume. Browsers prohibit unprompted autoplay, so audio initializes after the first click or key input. Lock loss, mission end, and component unmount stop all loops.

## 7. Belief Map

The enemy fuses new Radar Contacts into a `24×24` probability grid:

- Contact position and error create a probability region.
- Consecutive Contacts strengthen compatible cells and estimate aircraft motion.
- After Contact is lost, probability propagates along estimated velocity while diffusing and decaying.
- The heatmap means “where the enemy thinks the aircraft may be,” not that the enemy knows truth.

Belief is visible only under `TOTAL INTEL` or development debug access.

Structured events, Commander/Operator scores, and enemy internals are also limited to full enemy-system visibility. Mission history retains at most the latest 200 events, and audio consumes event IDs so long missions cannot accumulate unbounded logs or replay old sounds.

### 7.1 Enemy Awareness

Awareness is per-mission overall enemy alert from 0 to 100:

- `CALM`: 0–17, routine monitoring.
- `SUSPICIOUS`: 18–41, stronger coordinated-search tendency.
- `SEARCHING`: 42–71, active multi-radar search.
- `HUNTING`: 72–100, strong focused-track tendency.

Contacts raise Awareness according to confidence and signal strength. Without new evidence it decays slowly. Weapon release adds 34 because the enemy knows its target has been attacked. Awareness controls global Commander search intensity. Player-visible track quality controls lock, missile launch, and guidance break. They are separate values.

## 8. Air Defense Commander

At 100% command-link efficiency, the Commander evaluates Awareness, Belief, and radar state once per second and selects an intent. Lower efficiency lengthens that interval inversely.

- `MONITOR`: favors Wide Search.
- `COORDINATED_SEARCH`: favors Sector Search and assigns staggered bearings across radars.
- `CONCENTRATE_SEARCH`: strongly favors Focused Track.
- After target destruction, weapon release raises Awareness, but Commander must still derive search bearing from Belief/CMD and cannot use the target position as the aircraft position.
- Commander has no network-silence intent, and Operators have no shutdown mode.

### 8.1 Command-Link Efficiency

Command-link efficiency controls evidence sharing and execution of Commander orders:

- 100%: full command bias, other radars may use a shared Contact for 4.5 seconds, and Commander updates once per second.
- Lower values: longer decision intervals, shorter shared-Contact windows, greater search-bearing error, and proportionally weaker Utility bias.
- A radar's own Contact and local fire control remain available after command-link damage. The main losses are joint tracking and rapid retasking.
- It does not reduce single-radar base detection probability or range.

A successful COMMAND STRIKE multiplies later command-link efficiency by 65%. Configuration retains a 45% lower bound for future network expansion, but the current network contains only one COMMAND STRIKE, so the reachable minimum is 65%.

## 9. Mission Network and Persistent Effects

Each Run contains three sequential either-or stages and a Final Strike. Only destroying the target and extracting changes a node to `COMPLETED`, expires its same-stage alternative, and unlocks the next stage. Failure does not advance the network: the attempted node is `FAILED` but retryable, its alternative remains `AVAILABLE`, and the next stage stays locked. A matching Seed reproduces the base network and mission content; matching final deployment and limited intelligence also require the same Run history.

At most two INTEL nodes are allowed because access has only two effective transitions: `0/2 → 1/2 → 2/2`. The current topology offers INTEL in stages one and three. If STRIKE is chosen in stage one, the stage-three INTEL becomes the first INTEL and can grant only `1/2`; no node remains for `TOTAL INTEL`. The generator rejects any topology with a third INTEL node.

Persistent mission effects are:

- `INTEL`: the first completion reveals all radars and verifies coordinates and types; the second authorizes `TOTAL INTEL`. No continuous quality value is awarded.
- `STRIKE`: every completion multiplies all later radar scan rates by 90%; the current maximum of two gives 81%. The configured 65% floor is reserved for future expansion and cannot be reached now.
- `SEAD`: multiplies later radar ranges by 90%. It does not change scan speed or prevent the Final Strike Fire Control reinforcement. The configured 55% floor cannot be reached in the current topology.
- `COMMAND STRIKE`: multiplies later command-link efficiency by 65%. Only one exists in the current topology; the configured 45% floor is unreachable.
- `FINAL STRIKE`: completing it wins the Run.

The network no longer stores `intelAccuracyBonus`, base intelligence-quality percentages, or independent Intel points. Tier 1 replaces radar coordinates and type identity with truth but keeps pre-existing range estimates or unknown ranges. Tier 2 exposes real range and enemy internals through `TOTAL INTEL`.

### 9.1 Preview and Debrief

- Any locked node may open Preview Mission, a read-only map prepared from current Run state. It cannot plan or launch.
- Preview obeys current INTEL access. After SEAD, INTEL, or another mission changes the Run, reopening the preview may produce a different current estimate.
- On successful extraction, the game freezes map, aircraft, route, weather, radar, Contact, Belief, Commander, and Operator state.
- A completed node may open Debrief Mission. Mission view restores what was visible at completion; panoramic view exposes the frozen full enemy state.
- Debrief reads history only and cannot modify the current Mission, network, or persistent state.

### 9.2 Enemy Alert, Awareness, and THREAT WARNING

Enemy Alert is persistent strategic readiness from 0 to 100 and currently has no natural decay:

- Mission success adds 2; failure adds 10.
- Preparing any later mission or retry multiplies base radar range by `1 + Enemy Alert / 250`.
- At Enemy Alert ≥ 15, Final Strike adds an `ALERT-GUARD` Early Warning radar. Its range receives up to an additional 18% Alert-based increase.
- The network's `RADAR COVERAGE` displays only the persistent SEAD modifier. Enemy Alert range increase is multiplied separately during mission preparation.

Do not confuse these states. Enemy Alert persists across missions and changes later defense. Awareness is a per-mission Commander input that decays after evidence disappears. THREAT WARNING is the aircraft-specific tracking, lock, and missile state.

The four precursor missions affect distinct dimensions: INTEL changes information access, STRIKE changes temporal sampling, SEAD changes spatial coverage, and COMMAND STRIKE changes multi-radar coordination. `RADAR COVERAGE` and `RADAR SCAN` are therefore separate persistent values.

### 9.3 OPERATION CODE, Map, and Deterministic Randomness

`OPERATION CODE` is the Run's root Seed, comparable to a Minecraft world seed. The string is hashed with FNV-1a into a 32-bit state, then consumed by Mulberry32. The fixed three-stage network uses the root Seed and node IDs such as `CODE:C0-0`. Mission content then uses `<Node Seed>:MISSION-CONTENT`.

Each base mission generates:

- 2–4 static mountain terrain zones with Seed-driven position, size, and detection multiplier.
- 1–2 dynamic weather cells with Seed-driven type, position, size, velocity, intensity, phase, and period.
- 3–5 radars cycling through Early Warning, Acquisition, and Fire Control, with Seed-driven position, range, and initial heading.
- One target in the upper-middle portion of the map.

Enemy Alert, SEAD, STRIKE, COMMAND STRIKE, Enemy Adaptation, and Final Strike reinforcement are applied before limited intelligence is regenerated against the final radar deployment.

The map is `1000×1000 u` with a `100 u` grid. F-117 insertion is fixed at `(90, 850)`, extraction at `(860, 50, 100×100)`, and target generation at `x=400–790, y=100–390`. Radar centers keep `80 u` clearance from the extraction rectangle, though real coverage may extend into extraction. Final preparation also guarantees one Fire Control radar fully covers the target's `58 u` attack zone with `20 u` margin.

Named sub-Seeds isolate systems:

```text
Limited radar intel  <Node Seed>-M01:INTEL:<Radar ID>
Forecast error       <Node Seed>:FORECAST:<Weather ID>:<Horizon>
Final reinforcement  <Node Seed>-M01:FINAL-DEFENSE
Detection roll       <Node Seed>-M01:<Radar ID>:<Scan Count>
```

Weather truth is a pure function of initial parameters and absolute mission time. Detection randomness depends on scan count. Exact reproduction therefore requires the same Seed, version, Run history, route edits, and time evolution. A Seed fixes the base world only; choices, failures, alert, rewards, and flown history still modify final deployment.

## 10. Current Progression Boundary

- Mission success remains in a frozen result state until the player returns to the network. There is no inserted reward-selection phase.
- Tactical Reward and Player Build flows do not exist.
- Progression comes from discrete intelligence access, Enemy Alert, Radar Coverage, Radar Scan, Command Link, and Enemy Adaptation.
- Gameplay variety comes from generated maps, radars, weather, and mission-network changes.

## 11. Enemy Adaptation

After a mission, the enemy analyzes history that actually occurred, never an unflown route:

- Terrain use: proportion of trajectory samples inside masking terrain.
- North-south preference: vertical distribution of actual trajectory samples.
- Direct routing: straight-line distance between trajectory endpoints divided by actual flown distance.

Successful routes update the profile with weight `1.0`; failed routes use `0.5`. Mission count is not an adaptation level. Radar repositioning is driven by significant features:

- Terrain use at or above 35% moves coverage toward the mountain exit.
- North-south deviation from center at or above 8% moves a radar toward that corridor.
- Direct routing at or above 72% moves a radar toward the insertion-to-target axis.

One, two, or three identified features produce reposition strengths of 22%, 32%, or 42%. The mission network displays the profile as `LOW / ACTIVE / HIGH`.

`COUNTER DEPLOYMENT` lists the countermeasures applied to the current mission. Because the enemy learns historical tendencies rather than future plans, the player can change doctrine or intentionally build a misleading profile.

## 12. Route-Planning Guidance

- Do not treat yellow intelligence circles as true boundaries. Preserve margin for uncertainty and overlapping radar coverage.
- Cross near radar-range edges rather than near radar centers.
- Nose-on or tail-on exposure is normally safer than broadside exposure.
- Terrain and severe weather reduce probability but never guarantee invisibility.
- Weather concealment must be balanced against speed loss. Storm masks most strongly but slows the aircraft by 30%, increasing time inside coverage.
- After Contact, change heading before Sector Search or Focused Track repeatedly intersects the predicted route.
- Sustained illumination or lock demands immediate beam exit. After missile launch, reduce track quality below 32 within 8 seconds.
- Weapon release raises Awareness and makes coordinated or concentrated search more likely, although search position must still come from Belief/CMD.
- The first INTEL completion reveals and verifies every radar; the second authorizes `TOTAL INTEL`. SEAD shrinks later danger areas, while COMMAND STRIKE weakens coordination.
- Reusing one corridor causes later radars to move toward it. Vary north-south routing, terrain use, and attack angle.
- Preserve fuel for extraction after the strike. Excessive detours can exceed the `2000 u` range even when they avoid radar.

## 13. Final Strike

Final Strike assembles air defense from the complete Run history at launch:

- A reserve `FINAL-GUARD` Fire Control radar is always added near the target. SEAD reduces its range but cannot prevent deployment.
- Enemy Alert ≥ 15 adds an alert reinforcement whose range also grows slightly with Alert.
- Enemy Adaptation with at least 2 accumulated observation weight and at least two significant features adds one adaptive interception radar according to historical north-south preference.
- Completed STRIKE scan reduction applies to every final radar, including reinforcements: 90% after one and 81% after two.
- COMMAND STRIKE command-link damage, discrete INTEL visibility, and SEAD range reduction remain active.

`FINAL DEFENSE BRIEFING` lists the outcome of each historical condition. Reinforcements still pass through the limited-intelligence system and do not automatically expose real positions. Destroying the final target and extracting changes the Run to `VICTORY`.

## 14. Not Yet Implemented

- Anti-radiation missiles and direct destruction of radars during a mission.
- Emission exposure, live ELINT direction finding, and live player-side intelligence updates.
- Variable fuel load, external tanks, and independent weapon loadout. The fixed `2000 u` full-fuel range is implemented.
- Formal difficulty settings, tutorial missions, multiple save slots, and cloud synchronization. One local browser Run is already persisted.
- Strict route reachability and mathematical solvability proofs for generated missions. Current generation enforces only local constraints such as extraction clearance and target-area Fire Control coverage.

These absent systems must not be simulated through `TOTAL INTEL` or development debug visuals. Full visibility observes only enemy systems that actually exist.
