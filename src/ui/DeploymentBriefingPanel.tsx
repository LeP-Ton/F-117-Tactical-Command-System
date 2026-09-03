import { CollapsibleSection } from "./CollapsibleSection";
import { localizeBriefingNote, useI18n } from "../i18n/I18n";

interface DeploymentBriefingPanelProps {
  title: string;
  notes: readonly string[];
  meta?: string | number;
  defaultExpanded?: boolean;
}

export function DeploymentBriefingPanel({ title, notes, meta = notes.length, defaultExpanded = false }: DeploymentBriefingPanelProps) {
  const { language } = useI18n();
  if (notes.length === 0) return null;
  return <CollapsibleSection title={title} meta={meta} defaultExpanded={defaultExpanded}>
    <ol className="event-list briefing-list">{notes.map((note) => <li key={note}><span>{localizeBriefingNote(note, language)}</span></li>)}</ol>
  </CollapsibleSection>;
}
