import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  I18nProvider,
  localeCatalogs,
  localizeBriefingNote,
  useI18n,
} from "./I18n";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function LanguageProbe() {
  const { language, setLanguage, copy } = useI18n();
  return <>
    <span>{copy.campaign.title}</span>
    <button aria-label={copy.app.selectLanguage} onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>{language}</button>
  </>;
}

function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => collectKeyPaths(item, `${prefix}.${index}`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => collectKeyPaths(nested, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

function collectStrings(value: unknown, prefix = ""): Array<[string, string]> {
  if (Array.isArray(value)) return value.flatMap((item, index) => collectStrings(item, `${prefix}.${index}`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) => collectStrings(nested, prefix ? `${prefix}.${key}` : key));
  }
  return typeof value === "string" ? [[prefix, value]] : [];
}

describe("游戏界面国际化", () => {
  it("中英文目录结构完全一致", () => {
    expect(collectKeyPaths(localeCatalogs.en)).toEqual(collectKeyPaths(localeCatalogs.zh));
    expect(localeCatalogs.zh.app.missionGuidance).toBe("任务引导");
    expect(localeCatalogs.en.app.missionGuidance).toBe("MISSION GUIDANCE");
    expect(localeCatalogs.zh.app.subtitle).toContain("版本 1.1");
    expect(localeCatalogs.en.app.subtitle).toContain("VERSION 1.1");
    const untranslatedEnglish = collectStrings(localeCatalogs.en)
      .filter(([, value]) => /[\u3400-\u9fff]/u.test(value));
    expect(untranslatedEnglish).toEqual([]);
    const untranslatedChineseTerms = collectStrings(localeCatalogs.zh)
      .filter(([, value]) => /\b(?:INTEL|SEAD|STRIKE|TOTAL|CONTACT|BELIEF|COMMANDER|AI|CMD|NAV|MISSION)\b/iu.test(value));
    expect(untranslatedChineseTerms).toEqual([]);
  });

  it("切换语言会立即更新界面、根语言标记和独立偏好", () => {
    render(<I18nProvider initialLanguage="zh"><LanguageProbe /></I18nProvider>);
    expect(screen.getByText("任务网络")).toBeInTheDocument();
    expect(document.title).toBe("F-117 战术指挥系统");
    fireEvent.click(screen.getByRole("button", { name: "选择语言" }));
    expect(screen.getByText("MISSION NETWORK")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("F-117 Tactical Command System");
    expect(localStorage.getItem("f117-tactical-command-system:language:v1")).toBe("en");
  });

  it("当前最终防御简报均可翻译且目录不再包含已删除系统", () => {
    const currentBriefingNotes = [
      "最终目标启用分层防空戒备",
      "目标区后备火控雷达上线",
      "指挥打击战果削弱最终指挥链",
      "情报战果已核实最终目标雷达坐标与型号",
    ];
    currentBriefingNotes.forEach((note) => {
      expect(localizeBriefingNote(note, "en")).not.toMatch(/[\u3400-\u9fff]/u);
    });
    expect(collectStrings(localeCatalogs.en).map(([, value]) => value)).not.toEqual(
      expect.arrayContaining(["ENEMY ALERT", "ENEMY ADAPTATION"]),
    );
  });
});
