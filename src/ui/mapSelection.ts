export type MapElementSelection =
  | { kind: "AIRCRAFT" }
  | { kind: "TARGET" }
  | { kind: "EXTRACTION" }
  | { kind: "WAYPOINT"; id: string }
  | { kind: "TERRAIN"; id: string }
  | { kind: "WEATHER"; id: string }
  | { kind: "RADAR"; id: string };

export function isSameMapSelection(
  first: MapElementSelection | null,
  second: MapElementSelection,
): boolean {
  return first?.kind === second.kind
    && (!("id" in second) || ("id" in first && first.id === second.id));
}
