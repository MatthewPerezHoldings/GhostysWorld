export interface StateMachineHooks<S extends string> {
  onEnter?: (entering: S, leaving: S) => void;
  onExit?: (leaving: S, entering: S) => void;
}

export class DogStateMachine<S extends string> {
  private state: S;
  private elapsed = 0;

  constructor(
    initial: S,
    private readonly transitions: Record<S, readonly S[]>,
    private readonly hooks: StateMachineHooks<S> = {},
  ) {
    this.state = initial;
  }

  get current(): S {
    return this.state;
  }

  get timeInState(): number {
    return this.elapsed;
  }

  tick(deltaSec: number) {
    this.elapsed += deltaSec;
  }

  transition(next: S): boolean {
    const allowed = this.transitions[this.state] ?? [];
    if (!allowed.includes(next)) return false;
    const prev = this.state;
    this.hooks.onExit?.(prev, next);
    this.state = next;
    this.elapsed = 0;
    this.hooks.onEnter?.(next, prev);
    return true;
  }
}
