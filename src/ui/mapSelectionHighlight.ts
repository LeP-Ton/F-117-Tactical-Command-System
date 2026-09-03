export interface SelectionHighlightBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionHighlightSegment {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

/**
 * 生成位于选中轮廓外侧的四组直角标记，每组由一条横线和一条竖线组成。
 */
export function getSelectionCornerSegments(
  bounds: SelectionHighlightBounds,
  offset: number,
  armLength: number,
): SelectionHighlightSegment[] {
  const left = bounds.x - offset;
  const right = bounds.x + bounds.width + offset;
  const top = bounds.y - offset;
  const bottom = bounds.y + bounds.height + offset;

  return [
    { from: { x: left, y: top }, to: { x: left + armLength, y: top } },
    { from: { x: left, y: top }, to: { x: left, y: top + armLength } },
    { from: { x: right - armLength, y: top }, to: { x: right, y: top } },
    { from: { x: right, y: top }, to: { x: right, y: top + armLength } },
    { from: { x: left, y: bottom }, to: { x: left + armLength, y: bottom } },
    { from: { x: left, y: bottom - armLength }, to: { x: left, y: bottom } },
    { from: { x: right - armLength, y: bottom }, to: { x: right, y: bottom } },
    { from: { x: right, y: bottom - armLength }, to: { x: right, y: bottom } },
  ];
}

/**
 * 使用平滑周期控制角标明暗，避免硬切闪烁干扰地图判读。
 */
export function getSelectionPulseOpacity(timestampMs: number): number {
  const cycleMs = 1100;
  const phase = (timestampMs / cycleMs) * Math.PI * 2;
  const normalized = (Math.sin(phase) + 1) / 2;
  return 0.38 + normalized * 0.62;
}
