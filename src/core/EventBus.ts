type EventHandler<TEvent> = (event: TEvent) => void;

/** 领域事件总线；后续雷达、AI 与复盘系统可共享同一事件边界。 */
export class EventBus<TEvent> {
  private handlers = new Set<EventHandler<TEvent>>();

  subscribe(handler: EventHandler<TEvent>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  publish(event: TEvent): void {
    this.handlers.forEach((handler) => handler(event));
  }
}
