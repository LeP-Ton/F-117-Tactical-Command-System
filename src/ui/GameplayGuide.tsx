import { useEffect, useRef, type RefObject } from "react";
import { useI18n } from "../i18n/I18n";

interface GameplayGuideProps {
  open: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  missionRunning: boolean;
}

export function GameplayGuide({ open, onClose, onStartTutorial, triggerRef, missionRunning }: GameplayGuideProps) {
  const { copy } = useI18n();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, triggerRef]);

  if (!open) return null;
  const close = () => {
    onClose();
    triggerRef.current?.focus();
  };

  return <div className="guide-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="gameplay-guide" role="dialog" aria-modal="true" aria-labelledby="gameplay-guide-title">
      <header className="gameplay-guide-header">
        <div><span className="section-kicker">{copy.guide.kicker}</span><h2 id="gameplay-guide-title">{copy.guide.title}</h2></div>
        <button ref={closeButtonRef} type="button" className="guide-close" onClick={close} aria-label={copy.guide.close}><span aria-hidden="true" /></button>
      </header>
      {missionRunning && <p className="guide-live-warning">{copy.guide.liveWarning}</p>}
      <div className="gameplay-guide-content">
        {copy.guide.sections.map(([title, content]) => <article key={title}><h3>{title}</h3><p>{content}</p></article>)}
      </div>
      <footer className="gameplay-guide-footer">
        <button type="button" className="primary-button" onClick={onStartTutorial}>{copy.guide.startTutorial}</button>
      </footer>
    </section>
  </div>;
}
