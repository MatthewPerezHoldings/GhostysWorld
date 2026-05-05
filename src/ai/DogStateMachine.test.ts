import { describe, it, expect, vi } from "vitest";
import { DogStateMachine } from "./DogStateMachine";

type S = "IDLE" | "ALERT" | "CHASE";

describe("DogStateMachine", () => {
  it("starts in the initial state", () => {
    const fsm = new DogStateMachine<S>("IDLE", { IDLE: ["ALERT"], ALERT: ["CHASE", "IDLE"], CHASE: ["IDLE"] });
    expect(fsm.current).toBe("IDLE");
  });

  it("transitions when allowed", () => {
    const fsm = new DogStateMachine<S>("IDLE", { IDLE: ["ALERT"], ALERT: ["CHASE", "IDLE"], CHASE: ["IDLE"] });
    fsm.transition("ALERT");
    expect(fsm.current).toBe("ALERT");
  });

  it("ignores disallowed transitions", () => {
    const fsm = new DogStateMachine<S>("IDLE", { IDLE: ["ALERT"], ALERT: [], CHASE: [] });
    fsm.transition("CHASE");
    expect(fsm.current).toBe("IDLE");
  });

  it("fires onEnter and onExit hooks", () => {
    const onEnter = vi.fn();
    const onExit = vi.fn();
    const fsm = new DogStateMachine<S>(
      "IDLE",
      { IDLE: ["ALERT"], ALERT: ["IDLE"], CHASE: [] },
      { onEnter, onExit },
    );
    fsm.transition("ALERT");
    expect(onExit).toHaveBeenCalledWith("IDLE", "ALERT");
    expect(onEnter).toHaveBeenCalledWith("ALERT", "IDLE");
  });

  it("does not fire hooks for ignored transitions", () => {
    const onEnter = vi.fn();
    const fsm = new DogStateMachine<S>(
      "IDLE",
      { IDLE: ["ALERT"], ALERT: [], CHASE: [] },
      { onEnter },
    );
    fsm.transition("CHASE");
    expect(onEnter).not.toHaveBeenCalled();
  });

  it("tracks time spent in current state", () => {
    const fsm = new DogStateMachine<S>("IDLE", { IDLE: ["ALERT"], ALERT: [], CHASE: [] });
    fsm.tick(0.5);
    expect(fsm.timeInState).toBe(0.5);
    fsm.transition("ALERT");
    expect(fsm.timeInState).toBe(0);
  });
});
