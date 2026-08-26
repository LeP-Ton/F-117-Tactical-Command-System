import type { ReactNode } from "react";

interface TacticalWorkspaceProps {
  leftPanel: ReactNode;
  mapStage: ReactNode;
  rightPanel: ReactNode;
  className?: string;
}

/** 仅统一战术界面的三栏骨架，不感知任务、情报或复盘业务。 */
export function TacticalWorkspace({ leftPanel, mapStage, rightPanel, className = "" }: TacticalWorkspaceProps) {
  return <div className={`workspace ${className}`.trim()}>{leftPanel}{mapStage}{rightPanel}</div>;
}
