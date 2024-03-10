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

let uniqueId = 0;

export const createManager = (
  onLogicUpdated: VoidFunction,
  local = false
): LogicManager => {
  const lazyLogic: ReactNode[] = [];
  const dispatchers = new Map<AnyFunc, Dispatcher>();
  const results = new Map<AnyFunc, any>();
  const listeners = new Set<Listener>();
  const listenerQueue = new Set<Listener>();
  const loaded = new Set<Logic>();
  let isNotifying = false;
  const onLogicResultChange = (logic: AnyFunc, value: any) => {
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
    let dispatcher = dispatchers.get(logic);
    if (!dispatcher) {
      dispatcher = createDispatcher(logic, onLogicResultChange);
      dispatchers.set(logic, dispatcher);
    }
    return dispatcher;
  };

  return {
    delete(logic) {
      let changed = false;
      (Array.isArray(logic) ? logic : [logic]).forEach((x) => {
        const dispatcher = dispatchers.get(x);
        if (dispatcher?.node) {
          dispatchers.delete(x);
          results.delete(x);
          loaded.delete(x);
          const index = lazyLogic.indexOf(dispatcher.node);
          if (index !== -1) {
            lazyLogic.splice(index, 1);
            changed = true;
          }
        }
      });

      if (changed) {
        onLogicUpdated();
      }

      return true;
    },
    reset(logic) {
      let changed = false;
      (Array.isArray(logic) ? logic : [logic]).forEach((x) => {
        const dispatcher = dispatchers.get(x);
        if (dispatcher?.node) {
          const index = lazyLogic.indexOf(dispatcher.node);
          if (index !== -1) {
            const key = uniqueId++;
            loaded.delete(x);
            // change node
            const node = createElement(LogicDispatcher, {
              dispatch: dispatcher.dispatch,
              name: x.name,
              key,
            });
            lazyLogic[index] = node;
            dispatcher.node = node;
            changed = true;
          }
        }
      });

      if (changed) {
        onLogicUpdated();
      }

      return true;
    },
    getResult(logic) {
      if (local && results.has(logic)) {
        return results.get(logic);
      }
      const dispatcher = getDispatcher(logic);
      const result = dispatcher.result();
      if (result === NO_RESULT) {
        if (loaded.has(logic)) {
          throw RESOLVED_PROMISE;
        }

        const promise = enqueue(onLogicUpdated);

        loaded.add(logic);
        const key = uniqueId++;
        const node = createElement(LogicDispatcher, {
          dispatch: dispatcher.dispatch,
          name: logic.name,
          key,
        });

        dispatcher.node = node;
        lazyLogic.push(node);

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
    lazyLogic,
    onLogicAdded(handler) {
      onLogicUpdated = handler;
    },
  };
};
