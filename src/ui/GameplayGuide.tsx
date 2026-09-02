import { useEffect, useRef, type RefObject } from "react";

interface GameplayGuideProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  missionRunning: boolean;
}

const guideSections = [
  ["作战目标", "规划 F-117 航线，进入目标空域完成打击，并安全抵达东北撤离区。"],
  ["任务网络", "每层任务只能完成其一。行动选择会持续改变后续情报、防空覆盖、指挥链与最终目标防御。"],
  ["航线规划", "点击地图添加航点，拖动或排序航点；确认航线后任务将持续执行。"],
  ["实时调整", "飞行中可继续添加航点，并调整当前目标航点之后的路线；已飞路径不可修改。"],
  ["有限情报", "初始情报可能遗漏雷达，位置和覆盖也存在误差。首次完成 INTEL 可核实全部雷达坐标与型号；第二次完成后授权完整敌方态势。"],
  ["任务类型", "INTEL 核实情报；STRIKE 降低后续雷达扫描速率；SEAD 缩小后续雷达覆盖；COMMAND STRIKE 破坏协同搜索与联合跟踪；FINAL STRIKE 根据全部行动历史形成最终决战。"],
  ["生存规则", "关注燃油、动态天气和 THREAT WARNING，利用转向与遮蔽切断连续雷达接触。"],
  ["任务结果", "只有摧毁目标并成功撤离才算完成；失败可重试，成功任务可从任务网络复盘。"],
] as const;

export function GameplayGuide({ open, onClose, triggerRef, missionRunning }: GameplayGuideProps) {
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
        <div><span className="section-kicker">OPERATING INSTRUCTIONS</span><h2 id="gameplay-guide-title">操作说明</h2></div>
        <button ref={closeButtonRef} type="button" className="guide-close" onClick={close} aria-label="关闭操作说明"><span aria-hidden="true" /></button>
      </header>
      {missionRunning && <p className="guide-live-warning">任务执行中 // 飞行控制持续生效</p>}
      <div className="gameplay-guide-content">
        {guideSections.map(([title, content]) => <article key={title}><h3>{title}</h3><p>{content}</p></article>)}
      </div>
    </section>
  </div>;
}
