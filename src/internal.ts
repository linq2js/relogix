import { ReactNode, createContext } from "react";
import { Logic, LogicAPI } from "./types";

export type Listener = (logic: Logic) => void;

export type LogicManager = LogicAPI & {
  lazyLogic: ReactNode[];
  /**
   * return a logic wrapper function
   * @param logic
   */
  getResult(logic: Logic): any;

  getDispatcher(logic: Logic): Dispatcher;

  /**
   * listen logic data changed
   * @param listener
   */
  subscribe(listener: Listener): VoidFunction;

  onLogicAdded(handler: VoidFunction): void;
};

export type Dispatcher = { dispatch(): void; result(): any; node?: ReactNode };

export const NO_RESULT = {};
export const RESOLVED_PROMISE = Promise.resolve();

export const managerContext = createContext<LogicManager | null>(null);
