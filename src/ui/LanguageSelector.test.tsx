import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "../i18n/I18n";
import { LanguageSelector, languageOptions } from "./LanguageSelector";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function SelectorProbe() {
  const { copy } = useI18n();
  return <>
    <LanguageSelector />
    <span>{copy.campaign.title}</span>
  </>;
}

describe("语言选择弹窗", () => {
  it("从集中配置渲染全部语言并标记当前项", () => {
    render(<I18nProvider initialLanguage="zh"><SelectorProbe /></I18nProvider>);

    const trigger = screen.getByRole("button", { name: "选择语言" });
    expect(trigger).toHaveTextContent("中文");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "界面语言" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(languageOptions.length + 1);
    expect(screen.getByRole("button", { name: /简体中文/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /English/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("选择语言后立即更新界面、关闭弹窗并恢复触发按钮焦点", () => {
    render(<I18nProvider initialLanguage="zh"><SelectorProbe /></I18nProvider>);

    fireEvent.click(screen.getByRole("button", { name: "选择语言" }));
    fireEvent.click(screen.getByRole("button", { name: /English/ }));

    expect(screen.getByText("MISSION NETWORK")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select language" })).toHaveFocus();
    expect(localStorage.getItem("f117-tactical-command-system:language:v1")).toBe("en");
  });

  it("支持 Escape 与点击弹窗外部关闭", () => {
    render(<I18nProvider initialLanguage="zh"><SelectorProbe /></I18nProvider>);
    const trigger = screen.getByRole("button", { name: "选择语言" });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
