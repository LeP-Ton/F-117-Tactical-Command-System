import type { MissionSession } from "../domain/types";
import { CollapsibleSection } from "./CollapsibleSection";

interface WeatherForecastPanelProps {
  mission: Pick<MissionSession, "weather" | "weatherForecast">;
  defaultExpanded?: boolean;
}

export function WeatherForecastPanel({ mission, defaultExpanded = true }: WeatherForecastPanelProps) {
  return <CollapsibleSection title="WEATHER FORECAST" meta={`${mission.weather.length} CELLS`} defaultExpanded={defaultExpanded}>
    <ol className="weather-forecast-list">
      {mission.weatherForecast.map((forecast) => <li key={`${forecast.weatherId}-${forecast.horizonSeconds}`}>
        <strong>{forecast.weatherId} / T+{forecast.horizonSeconds}s</strong>
        <span>{forecast.kind} · {forecast.intensityTrend} · 可信度{forecast.confidence}</span>
        <small>预计区域 {forecast.estimatedPosition.x.toFixed(0)},{forecast.estimatedPosition.y.toFixed(0)} · {forecast.estimatedSize.width.toFixed(0)}×{forecast.estimatedSize.height.toFixed(0)}</small>
      </li>)}
    </ol>
  </CollapsibleSection>;
}
