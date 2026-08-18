import { describe, expect, it, vi } from "vitest";
import { EventBus } from "./EventBus";

describe("EventBus", () => {
  it("发布事件并支持取消订阅", () => {
    const bus = new EventBus<string>();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe(handler);
    bus.publish("contact");
    unsubscribe();
    bus.publish("ignored");
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith("contact");
  });
});
