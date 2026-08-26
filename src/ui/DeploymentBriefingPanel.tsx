import { CollapsibleSection } from "./CollapsibleSection";

interface DeploymentBriefingPanelProps {
  title: string;
  notes: readonly string[];
  meta?: string | number;
  defaultExpanded?: boolean;
}

export function DeploymentBriefingPanel({ title, notes, meta = notes.length, defaultExpanded = false }: DeploymentBriefingPanelProps) {
  if (notes.length === 0) return null;
  return <CollapsibleSection title={title} meta={meta} defaultExpanded={defaultExpanded}>
    <ol className="event-list briefing-list">{notes.map((note) => <li key={note}><span>{note}</span></li>)}</ol>
  </CollapsibleSection>;
}
