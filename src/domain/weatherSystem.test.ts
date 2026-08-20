import { describe, expect, it } from "vitest";
import { generateMissionContent } from "../procedural/missionGenerator";
import { advanceWeather, generateWeatherForecast, getWeatherSpeedFactor } from "./weatherSystem";
import type { WeatherCell, WeatherKind } from "./types";

function weatherAt(kind: WeatherKind): WeatherCell {
  return {
    id: kind, kind, initialKind: kind, x: 0, y: 0, width: 100, height: 100,
    detectionFactor: 0.7, origin: { x: 0, y: 0 }, baseSize: { width: 100, height: 100 },
    velocity: { x: 0, y: 0 }, baseIntensity: 0.5, phaseSeconds: 0, evolutionPeriodSeconds: 60,
  };
}

describe("动态天气与预报", () => {
  it("相同 Seed 与时间完整复现天气和预报", () => {
    const first = generateMissionContent("WEATHER-REPLAY");
    const second = generateMissionContent("WEATHER-REPLAY");
    expect(advanceWeather(first.weather, 75_000)).toEqual(advanceWeather(second.weather, 75_000));
    expect(first.weatherForecast).toEqual(second.weatherForecast);
    const direct = advanceWeather(first.weather, 75_000);
    const stepped = advanceWeather(advanceWeather(first.weather, 25_000), 75_000);
    expect(stepped).toEqual(direct);
  });

  it("天气位置、范围或类型会随任务时间变化", () => {
    const generated = generateMissionContent("WEATHER-DYNAMIC");
    const initial = advanceWeather(generated.weather, 0);
    const future = advanceWeather(generated.weather, 120_000);
    expect(future).not.toEqual(initial);
    expect(future.some((cell, index) =>
      cell.x !== initial[index]?.x
        || cell.width !== initial[index]?.width
        || cell.kind !== initial[index]?.kind)).toBe(true);
  });

  it("远期预报比近期预报可信度更低", () => {
    const generated = generateMissionContent("WEATHER-CONFIDENCE");
    const forecast = generateWeatherForecast("WEATHER-CONFIDENCE", generated.weather);
    expect(forecast.find((item) => item.horizonSeconds === 30)?.confidence).toBe("高");
    expect(forecast.find((item) => item.horizonSeconds === 90)?.confidence).toBe("低");
  });

  it("四种天气分别造成 10% 至 30% 减速，重叠时取最强效果", () => {
    const position = { x: 50, y: 50 };
    expect(getWeatherSpeedFactor(position, [weatherAt("CLOUD")])).toBe(0.9);
    expect(getWeatherSpeedFactor(position, [weatherAt("FOG")])).toBe(0.85);
    expect(getWeatherSpeedFactor(position, [weatherAt("RAIN")])).toBe(0.8);
    expect(getWeatherSpeedFactor(position, [weatherAt("STORM")])).toBe(0.7);
    expect(getWeatherSpeedFactor(position, [weatherAt("CLOUD"), weatherAt("STORM")])).toBe(0.7);
    expect(getWeatherSpeedFactor({ x: 150, y: 150 }, [weatherAt("STORM")])).toBe(1);
  });
});
