# F-117 Tactical Command System

[简体中文](README.md) | [English](README.en.md)

A military simulation game built around limited intelligence, route-planning puzzles, and cross-mission dynamic planning. The player does not directly pilot the aircraft. Instead, they act as a mission commander who plans the F-117's ingress, strike, and extraction route, then adjusts only the future legs while the mission continues to run.

- Play online: <https://lep-ton.github.io/F-117-Tactical-Command-System/>
- Exact rules and values: [Game Mechanics Manual](docs/game-mechanics.en.md)
- Stack: React 18, TypeScript, Vite, HTML Canvas, and Vitest
- In-game languages: Simplified Chinese / English, selectable from the language popover on every screen

This document is the design and development entry point. It explains why each system exists, how the systems work together, and which boundaries contributors must preserve. All balance-sensitive values, thresholds, state transitions, and reward formulas have a single documentation source: the Game Mechanics Manual.

## 1. Product Direction and Design Philosophy

### 1.1 The Puzzle Is Not a Static Shortest Path

The map combines radar coverage and scan behavior, terrain masking, dynamic weather, limited fuel, target-area defense, and extraction requirements. A safe route is neither a simple path around circles nor a geometric shortest path. It is a route with enough tolerance for risk, distance, time, and intelligence error.

Heading is part of the decision. The F-117's lateral exposure, the time spent inside coverage, and weather-induced speed changes can give two routes of similar length very different risk profiles. Once a mission starts, the world keeps moving and the player can modify only the legs beyond the current target waypoint. Planning and live revision therefore form one continuous puzzle.

### 1.2 Information Asymmetry Is the Core Resource

The player receives pre-mission radar reports and onboard warnings. The enemy receives noisy observations produced by its radars. Under normal conditions, neither side is given complete truth:

```text
Player side: reality → limited radar intelligence → route decision
Enemy side: aircraft truth → Radar Sensor → imperfect Contact → Belief → Commander
```

INTEL missions change what the player is allowed to observe. They do not improve the aircraft or weaken real radars. Full enemy-system visibility is an unlockable observation privilege: it exposes the same internal simulation without changing detection, command, engagement, or mission results.

### 1.3 Randomness Must Be Reproducible and Explainable

Radar detection is probabilistic, but it does not consume an opaque global random stream. The operation code, mission node, radar identity, and scan sequence determine isolated random streams. With the same version, run history, player actions, and time progression, a result can be reproduced. This makes route comparison, failure analysis, and strategy verification possible.

The operation code defines the base world only. Mission choices, failures, Enemy Alert, and historical flight paths continue to alter later deployments. The same Seed does not erase what the player has done.

### 1.4 Long-Term Progression Changes the Battlefield

There is no equipment build, aircraft stat progression, or random post-mission reward draft. Precursor missions affect separate dimensions: information, scan timing, coverage space, and network coordination. The enemy answers through persistent alert and a profile learned from flown routes.

The player is building the conditions of the final battlefield, not a stronger F-117. Every mission-network choice therefore asks whether the next route should become easier to understand or the real defense should become weaker.

### 1.5 Immersive Interface, Layered Documentation

The mission interface behaves like a tactical terminal. It shows mission state, intelligence, warnings, waypoints, and sensor readouts without explaining attack radii, probability formulas, or generation algorithms inside the live workspace.

The in-game Operating Instructions contain only what the player needs to make decisions. The Game Mechanics Manual owns precise rules. This README owns design intent, system relationships, and development boundaries.

### 1.6 Language Changes Only the Presentation Layer

The language button opens an extensible selection popover. The mission network, all tactical workspaces, the Canvas map, Operating Instructions, events, weather, and enemy-system panels render from the same locale catalog.

The preference is stored separately from mission state, Seeds, and debrief snapshots. Changing language does not dispatch a game action, pause simulation, rebuild a mission, or alter detection. Domain models keep stable enums and persisted values; localization happens only at the rendering boundary.

## 2. System Overview

```text
Operation code
  ├─ generates the mission network and each node's base world
  ├─ generates terrain, weather, radars, targets, and limited intelligence
  └─ derives isolated random streams for scans, forecasts, and reinforcements

Mission-network choices
  ├─ change intelligence access, radar scanning, coverage, or command links
  ├─ accumulate Enemy Alert
  └─ provide flown routes to Enemy Adaptation

Single mission
  ├─ route planning and live editing of future legs
  ├─ Radar → Contact → Belief → Commander → Engagement
  └─ destroy the target and extract, or return to the network after failure
```

These are not disconnected feature lists. Weather affects both concealment and speed. Scan-rate rewards affect the visible animation and the real sensor cadence. Command-link damage affects response time and multi-radar evidence sharing. Every displayed strategic parameter must be traceable to an actual simulation effect.

## 3. Single-Mission Loop

A mission consists of planning, continuous execution, strike, extraction, and settlement:

1. Enter an executable node from the mission network and plan waypoints on the tactical map.
2. Confirm the route after considering limited radar intelligence, terrain, weather forecasts, and fuel margin.
3. After launch, the mission cannot be paused, reset, or abandoned. The aircraft keeps moving.
4. The player may add or modify future legs beyond the current target waypoint. The flown path and current target remain locked.
5. Entering the attack area releases the weapon, but does not complete the mission.
6. Success requires both a destroyed target and entry into the extraction zone.
7. Success and failure freeze the scene. Failed nodes can be retried; successful nodes retain a debrief.

All mission types share this flight-level success condition. INTEL, SEAD, and COMMAND STRIKE describe strategic effects on the network, not separate flyover, reconnaissance, or radar-destruction objective models.

See the [Game Mechanics Manual](docs/game-mechanics.en.md) for exact attack distance, speed, fuel, failure, and waypoint-editing rules.

## 4. Mission Network and Strategic Rewards

Each Run contains three sequential either-or stages followed by a Final Strike. Completing one mission closes the alternative at that stage and unlocks the next stage. Failure advances neither the network nor a terminal defeat state.

Precursor missions intentionally operate on four orthogonal dimensions:

| Mission | Dimension | Design purpose |
|---|---|---|
| INTEL | Player information | Replace uncertainty with more dependable route decisions |
| STRIKE | Radar scan timing | Reduce scan and detection opportunities per unit of time |
| SEAD | Radar coverage space | Shrink the regions that must be avoided or crossed |
| COMMAND STRIKE | Network coordination | Delay command response and weaken multi-radar tracking |
| FINAL STRIKE | Entire Run history | Assemble the final defense from prior choices and enemy responses |

Better intelligence does not mean weaker radars, and smaller coverage does not mean slower scanning. Rewards stay separate so the difference between seeing a danger and physically weakening it remains legible.

Every operation also raises persistent enemy alert, with failure costing more than success. Precursor missions are therefore not free upgrades, and unlimited retries cannot erase strategic pressure.

The exact reward multipliers, alert changes, node states, and final-defense triggers are canonical in the [mission-network section of the mechanics manual](docs/game-mechanics.en.md).

## 5. Map, Terrain, and Dynamic Weather

### 5.1 The Map Combines Multiple Constraint Layers

The tactical map presents the target, extraction zone, waypoints, terrain, dynamic weather, and radar intelligence. Canvas handles rendering and coordinate interaction; domain models and the reducer remain the sole owners of mission rules and state.

Generation enforces local constraints such as extraction clearance and minimum target-area fire-control coverage. It does not yet prove mathematical reachability for every Seed. A generated battlefield is structurally valid, but not guaranteed to expose an obvious safe route.

### 5.2 Terrain Provides Static Concealment

Terrain does not move or change type during a mission. It reduces radar detection probability without directly changing speed or fuel. This makes terrain a dependable routing reference, but repeated use can become a historical preference that Enemy Adaptation learns.

### 5.3 Weather Creates Moving Windows

Weather cells move and change size, intensity, and type. Severe weather can reduce detection while also slowing the aircraft and extending exposure time, so it is never a pure benefit.

Weather is derived deterministically from initial parameters and absolute mission time, not frame rate. Fixed-horizon forecasts with deliberate error let the player plan an interception with future weather while preserving uncertainty. A forecast is not a rolling feed of future truth.

Weather types, speed penalties, detection stacking, and forecast-error rules live in the [Game Mechanics Manual](docs/game-mechanics.en.md).

## 6. Radar, Air-Defense Command, and Engagement

### 6.1 Layered Radar Network

The network contains long-range wide-beam early warning, balanced acquisition, and short-range high-quality fire-control radars. They specialize in early cues, sustained acquisition, and precise tracking. Any radar can advance engagement through its own Contact; fire control is the most efficient, not the only type capable of reaching a lock.

A radar calculates non-zero detection only when the aircraft is inside real range and the beam covers its direction. Distance, aircraft aspect, terrain, weather, and radar type shape each result. Scan lines are part of sensor behavior, not decorative animation detached from the model.

### 6.2 The Enemy Uses Imperfect Observations

```text
Reality
  → Radar Sensor
  → Imperfect Contact
  → Belief Map
  → Air Defense Commander / Radar Operator
  → Engagement
```

Only the sensor layer may read aircraft truth. A successful detection creates a Contact with position error, confidence, and strength. The Belief Map fuses Contacts, then propagates, diffuses, and decays after contact is lost. Commanders and operators must consume that imperfect information rather than reading the aircraft position to create artificial difficulty.

### 6.3 Operators and Commander Have Different Responsibilities

Each radar has an independent operator that chooses between wide search, sector search, and focused track through Utility scoring. The Commander reads overall awareness, Belief, and radar state, then assigns network-level intent and search direction.

Damaging the command link does not switch radars off or remove local fire control. It reduces decision speed, sharing windows, command influence, and joint-track quality. COMMAND STRIKE weakens the network rather than applying one generic debuff to every sensor.

### 6.4 Threat Feedback Remains Limited

The normal player view exposes only THREAT WARNING stages for suspected search, sustained tracking, lock, and missile inbound. It does not identify the exact radar source. The player must use route context, radar reports, and warning changes to decide how to break continuous Contact.

Radar values, action thresholds, Contact lifetime, command-link formulas, and missile-guidance conditions are canonical in the [Game Mechanics Manual](docs/game-mechanics.en.md).

## 7. Intelligence Access and Observability

Normal missions use limited radar reports with omissions, position error, and range-estimate error. Access is derived from completed INTEL nodes rather than a continuous intelligence-quality resource:

- Initial access preserves the uncertainty of pre-mission reports.
- The first effective INTEL mission verifies every subsequent radar's location and type without exposing enemy internals.
- The second effective INTEL mission authorizes full enemy-system visibility, including real radars, Contacts, Belief, Commander, and Operators.

Full visibility is both a formal campaign reward and a development tool. The two sources share presentation capabilities, but neither may feed information back into simulation results.

Locked nodes support a read-only preview of the current estimate. Preview and launch use the same mission-preparation logic, so the map reflects current rewards, alert, and adaptation without creating a Mission or modifying the Run.

## 8. Persistent Enemy Response and Final Strike

### 8.1 Enemy Alert Is Strategic Readiness

Enemy Alert persists across missions and represents the defense network's response to repeated intrusion. It changes later defenses and may trigger additional readiness forces in the final mission. It is distinct from per-mission Awareness and aircraft-specific THREAT WARNING.

### 8.2 Enemy Adaptation Learns Flown Routes

Adaptation reads only the path the aircraft has already flown, never future waypoints. It evaluates terrain use, north-south routing, and directness, then chooses radars to reposition through spatial relationships. Successful routes carry more learning weight than failed ones, although failed retries still reveal some behavior.

This creates an explainable profile that can also be deceived. Players can change habits to avoid a counter-deployment or deliberately establish a misleading historical preference.

### 8.3 Final Strike Resolves the Entire Run

The Final Strike adds target-area fire control, alert reinforcements, and adaptive interception to a base mission, then applies the scan, coverage, command-link, and intelligence outcomes created by previous choices. It is a resolution of the strategic route, not a normal node with a different name.

Exact alert thresholds, profile features, movement strength, and reinforcement rules live in the [Game Mechanics Manual](docs/game-mechanics.en.md).

## 9. Operation Code and Deterministic Generation

`OPERATION CODE` is the root Seed of a Run, comparable to a Minecraft world seed. The string is mapped to a deterministic integer state and then to pseudorandom sequences. The mission network, node contents, radar reports, weather forecasts, final reinforcements, and per-scan detection use isolated named substreams.

Stream isolation is an important extension rule: adding a weather parameter must not change which radar report is omitted, and opening one more UI preview must not consume detection randomness reserved for a launched mission.

After generating base content, the game applies mission rewards, Enemy Alert, Enemy Adaptation, Final Strike reinforcements, and safety constraints in a fixed order. Player intelligence is generated last so it always describes the final deployment rather than a radar that later rules have moved or replaced.

The exact hash, sub-Seed names, and preparation order are defined in the [Game Mechanics Manual](docs/game-mechanics.en.md).

## 10. Debrief, Persistence, Events, and Audio

Successful extraction stores a frozen snapshot rather than a Mission that can continue running. Mission-view debriefing restores what the player was authorized to see; panoramic debriefing exposes the complete enemy state at the successful instant. Neither view advances weather, radar, or Commander simulation.

The Run, mission network, current Mission, and successful debriefs are stored locally in the browser. Reloading a running mission resumes execution instead of creating a pause exploit. Language uses a separate preference and does not contaminate mission saves.

Audio is driven by domain events. Short events produce one-shot sounds; lock and missile warnings use cleanable loops. Mission end, lock loss, and component unmount must stop those loops. Event history is bounded and audio consumes unique event IDs so React rendering cannot replay an old sound.

## 11. Code Architecture

```text
src/core        Deterministic randomness and shared infrastructure
src/config      Map, aircraft, radar, and engagement parameters
src/domain      Pure route, radar, Contact, Belief, Commander, weather, and network logic
src/procedural  Seed-driven mission and mission-network generation
src/game        RunState, reducer, tick loop, mission preparation, and persistence
src/i18n        Locale catalogs, language context, and legacy briefing translation
src/ui          React tactical terminal, workspaces, and Canvas map
src/audio       Domain-event-driven Web Audio
```

### 11.1 Core State Boundaries

- `RunState` owns the mission network, persistent enemy state, current Mission, and successful debriefs.
- `MissionSession` owns the live state of one runnable mission.
- `MissionDebrief` is a frozen snapshot and must not be executed as a Mission.
- The reducer is the single source of truth for mission-state transitions.
- Canvas renders and reports coordinate interactions; it does not own a second game state.
- Shared UI components receive read-only data and callbacks rather than modifying `RunState` directly.
- Localization happens at the rendering boundary; domain enums, Seeds, and persisted state do not store the presentation language.

### 11.2 Invariants Contributors Must Preserve

- Only Radar Sensor may read aircraft truth; downstream enemy AI consumes Contacts.
- The normal view must not leak real radar locations through legends, lists, or highlighting.
- Full enemy visibility and development debug affect presentation only.
- Launch and locked-node preview share mission-preparation rules.
- Seed-driven output must not depend on frame rate.
- Waypoint permissions are protected by both UI and reducer rules.
- Every mission has one success definition: destroy the target and extract.
- Language selection changes presentation only and must not dispatch mission actions or alter timing.

New mechanics should place pure computation in `domain`, let the reducer orchestrate state evolution, and let React and Canvas consume the result. Do not implement a second radar, mission, or access-control model inside the UI.

## 12. Development and Deployment

Install and run locally:

```bash
npm install
npm run dev
```

Validate before submitting:

```bash
npm run typecheck
npm run test
npm run build
```

The `main` branch is built and deployed to GitHub Pages by GitHub Actions. Vite uses a relative asset base so the same build works in local preview and under the repository subpath.

## 13. Documentation Responsibilities

- [README.md](README.md): Chinese design philosophy, system relationships, architecture, and development entry point.
- [README.en.md](README.en.md): this English design and development document.
- [docs/game-mechanics.md](docs/game-mechanics.md): the sole Chinese documentation source for exact rules and values.
- [docs/game-mechanics.en.md](docs/game-mechanics.en.md): the equivalent English rules manual.
- `.agentdocs/workflow/`: implemented changes and complete diffs.
- `.agentdocs/proposals/`: unimplemented or rejected designs.

When design intent and a rule value both change, update the README explanation and the exact mechanics entry separately. A balance-only change must not copy the new number back into README.

## 14. Current Boundaries

- Desktop browsers and mouse input only.
- No formal difficulty modes, tutorial campaign, or strict solvability proof for generated missions.
- No in-mission radar destruction, anti-radiation missiles, or player-side live ELINT direction finding.
- No radar shutdown, emission-control, or decoy modes.
- No variable fuel load, external tanks, or independent weapon loadout.
- No multiple save slots or cloud synchronization.
- No equipment build or random post-mission upgrades.

These boundaries must be modeled explicitly before expansion. Copy, debug layers, or full-intelligence views must not imply that an unimplemented system already exists.
