import { useEffect, useRef, useState } from "react";
import { useI18n, type Language } from "../i18n/I18n";

interface LanguageOption {
  id: Language;
  shortLabel: string;
  nativeLabel: string;
}

/**
 * 所有可选语言集中维护在这里。后续增加语言时只需扩展语言目录与本列表，
 * 顶部工具栏不再依赖“两种语言互相翻转”的特殊逻辑。
 */
export const languageOptions = [
  { id: "zh", shortLabel: "中文", nativeLabel: "简体中文" },
  { id: "en", shortLabel: "EN", nativeLabel: "English" },
] satisfies readonly LanguageOption[];

export function LanguageSelector() {
  const { language, setLanguage, copy } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOptionRef = useRef<HTMLButtonElement>(null);
  const currentOption = languageOptions.find((option) => option.id === language) ?? languageOptions[0];

  const closeAndRestoreFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    selectedOptionRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeAndRestoreFocus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return <div className="language-selector" ref={rootRef}>
    <button
      ref={triggerRef}
      type="button"
      className="language-trigger"
      aria-label={copy.app.selectLanguage}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
    >
      <span>{currentOption.shortLabel}</span>
      <i className={open ? "expanded" : ""} aria-hidden="true" />
    </button>
    {open && <div className="language-popover" role="dialog" aria-label={copy.app.languageDialogTitle}>
      <div className="language-popover-title">{copy.app.languageDialogTitle}</div>
      <div className="language-option-list">
        {languageOptions.map((option) => {
          const selected = option.id === language;
          return <button
            key={option.id}
            ref={selected ? selectedOptionRef : undefined}
            type="button"
            className={`language-option ${selected ? "active" : ""}`}
            aria-pressed={selected}
            onClick={() => {
              setLanguage(option.id);
              closeAndRestoreFocus();
            }}
          >
            <span className="language-option-code">{option.id.toUpperCase()}</span>
            <span className="language-option-name">{option.nativeLabel}</span>
            {selected && <span className="language-option-status">{copy.app.currentLanguage}</span>}
          </button>;
        })}
      </div>
    </div>}
  </div>;
}
