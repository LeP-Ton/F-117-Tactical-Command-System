import { useState, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: ReactNode;
  meta?: ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

/** 侧栏通用折叠区，折叠只隐藏内容，不改变任何游戏领域状态。 */
export function CollapsibleSection({
  title,
  meta,
  className = "",
  defaultExpanded = true,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className={`panel-section collapsible-section ${className}`.trim()}>
      <button
        type="button"
        className="collapsible-heading"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span>{title}</span>
        <span className="collapsible-meta">
          {meta}
          <i aria-hidden="true" className={expanded ? "expanded" : ""} />
        </span>
      </button>
      <div className="collapsible-content" hidden={!expanded}>{children}</div>
    </section>
  );
}
