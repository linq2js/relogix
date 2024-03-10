import { ReactNode, createElement } from "react";
import {
  Dispatcher,
  Listener,
  LogicManager,
  NO_RESULT,
  RESOLVED_PROMISE,
} from "./internal";
import { AnyFunc, Logic } from "./types";
import { createDispatcher } from "./createDispatcher";
import { enqueue } from "./utils";
import { LogicDispatcher } from "./LogicDispatcher";

export const createManager = (
  onLogicAdded: VoidFunction,
  local = false
): LogicManager => {
  const dynamicLogic: ReactNode[] = [];
  const logicDispatchers = new Map<AnyFunc, Dispatcher>();
  const results = new Map<AnyFunc, any>();
  const listeners = new Set<Listener>();
  const listenerQueue = new Set<Listener>();
  const logicLoaded = new Set<Logic>();
  let isNotifying = false;
  const onLogicChange = (logic: AnyFunc, value: any) => {
    const changed = results.has(logic);
    results.set(logic, value);
    if (changed) {
      try {
        isNotifying = true;
        listeners.forEach((listener) => listener(logic));
      } finally {
        isNotifying = false;
        listenerQueue.forEach((x) => listeners.add(x));
        listenerQueue.clear();
      }
    }
  };

  const getDispatcher = (logic: AnyFunc) => {
    let dispatcher = logicDispatchers.get(logic);
    if (!dispatcher) {
      dispatcher = createDispatcher(logic, onLogicChange);
      logicDispatchers.set(logic, dispatcher);
    }
    return dispatcher;
  };

  return {
    getResult(logic) {
      if (local && results.has(logic)) {
        return results.get(logic);
      }
      const dispatcher = getDispatcher(logic);
      const result = dispatcher.result();
      if (result === NO_RESULT) {
        if (logicLoaded.has(logic)) {
          throw RESOLVED_PROMISE;
        }

        const promise = enqueue(onLogicAdded);

        logicLoaded.add(logic);
        dynamicLogic.push(
          createElement(LogicDispatcher, {
            dispatch: dispatcher.dispatch,
            name: logic.name,
            key: dynamicLogic.length,
          })
        );

        throw promise;
      }

      return result;
    },
    subscribe(listener) {
      if (isNotifying) {
        listenerQueue.add(listener);
      } else {
        listeners.add(listener);
      }
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        listeners.delete(listener);
      };
    },
    getDispatcher: getDispatcher,
    dynamicLogic: dynamicLogic,
    onLogicAdded(handler) {
      onLogicAdded = handler;
    },
  };
};
