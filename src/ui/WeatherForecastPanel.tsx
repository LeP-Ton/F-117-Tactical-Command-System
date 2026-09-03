import type { MissionSession } from "../domain/types";
import { useI18n } from "../i18n/I18n";
import { CollapsibleSection } from "./CollapsibleSection";

interface WeatherForecastPanelProps {
  mission: Pick<MissionSession, "elapsedMs" | "weather" | "weatherForecast">;
  defaultExpanded?: boolean;
}

export function WeatherForecastPanel({ mission, defaultExpanded = true }: WeatherForecastPanelProps) {
  const { copy } = useI18n();
  // 预报是出动前生成的任务绝对时刻快照，不把已经过去的时刻继续伪装成“未来”。
  const activeForecasts = mission.weatherForecast.filter(
    (forecast) => forecast.horizonSeconds * 1000 > mission.elapsedMs,
  );
  return <CollapsibleSection title={copy.forecast.title} meta={`${mission.weather.length} ${copy.forecast.cells}`} defaultExpanded={defaultExpanded}>
    <ol className="weather-forecast-list">
      {activeForecasts.length === 0 && <li><span>{copy.forecast.expired}</span></li>}
      {activeForecasts.map((forecast) => <li key={`${forecast.weatherId}-${forecast.horizonSeconds}`}>
        <strong>{forecast.weatherId} / {copy.common.taskTimePrefix}{forecast.horizonSeconds}{copy.common.secondsUnit}</strong>
        <span>{copy.enums.weatherKind[forecast.kind]} · {copy.enums.weatherTrend[forecast.intensityTrend]} · {copy.forecast.confidence} {copy.enums.confidence[forecast.confidence]}</span>
        <small>{copy.forecast.estimatedArea} {forecast.estimatedPosition.x.toFixed(0)},{forecast.estimatedPosition.y.toFixed(0)} · {forecast.estimatedSize.width.toFixed(0)}×{forecast.estimatedSize.height.toFixed(0)}</small>
      </li>)}
    </ol>
  </CollapsibleSection>;
}
