import { useEffect, useMemo, useRef, useState } from "react";
import { Loadable, Logic, LogicAPI } from "./types";
import { useManager } from "./useManager";
import { debounce, isPromiseLike } from "./utils";
import { isLoadable, loadable } from "./loadable";

export type Awaitable<T = any> = Logic<T> | Promise<T> | Loadable<T>;

export type UseLogicFn = {
  (): LogicAPI;

  <const T extends Awaitable | readonly Awaitable[]>(logic: T): T extends Logic<
    infer R
  >
    ? R
    : {
        [key in keyof T]: T[key] extends Logic<infer R>
          ? R
          : T[key] extends Promise<infer R>
          ? R
          : T[key] extends Loadable<any>
          ? T[key]
          : never;
      };
};

/**
 * Retrieve the logic data and re-render it whenever the logic data changes.
 * @param logic
 * @returns
 */
const useLogicInternal = <const T extends Awaitable | readonly Awaitable[]>(
  logic: T
): T extends Logic<infer R>
  ? R
  : {
      [key in keyof T]: T[key] extends Logic<infer R>
        ? R
        : T[key] extends Promise<infer R>
        ? R
        : T[key] extends Loadable<any>
        ? T[key]
        : never;
    } => {
  const manager = useManager();
  const rerender = useState({})[1];
  const isMultiple = Array.isArray(logic);
  const logicList: Logic[] = isMultiple ? logic : [logic];
  const results: unknown[] = [];
  const promises: Promise<unknown>[] = [];
  const update = useMemo(() => debounce(() => rerender({})), [rerender]);
  const unsubscribeRef = useRef(new Set<VoidFunction>());

  unsubscribeRef.current.forEach((x) => x());
  unsubscribeRef.current.clear();

  logicList.forEach((x) => {
    if (isPromiseLike(x)) {
      const l = loadable(x);
      if (l.loading) {
        promises.push(x);
      } else {
        if (l.error) throw l.error;
        results.push(l.data);
      }
      return;
    }

    if (isLoadable(x)) {
      if (x.loading) {
        unsubscribeRef.current.add(x.onDone(update));
      }
      results.push(x);
      return;
    }

    try {
      results.push(manager.getResult(x));
    } catch (ex) {
      if (isPromiseLike(ex)) {
        promises.push(ex);
      } else {
        throw ex;
      }
    }
  });

  if (promises.length) {
    throw Promise.all(promises);
  }

  const logicRef = useRef(logicList);
  logicRef.current = logicList;

  useEffect(() => {
    const unsubscribeLogicChange = manager.subscribe((logic) => {
      if (!logicRef.current.includes(logic)) return;
      update();
    });

    return () => {
      unsubscribeLogicChange();
      unsubscribeRef.current.forEach((x) => x());
    };
  }, [rerender, manager]);

  return isMultiple ? results : (results[0] as any);
};

export const useLogic: UseLogicFn = (...args: any[]): any => {
  if (!args.length) return useManager();
  return useLogicInternal(args[0]);
};
