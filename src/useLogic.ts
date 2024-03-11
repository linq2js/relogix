import { useEffect, useMemo, useState } from "react";
import { Loadable, Logic, LogicAPI } from "./types";
import { useManager } from "./useManager";
import { debounce, isPromiseLike } from "./utils";
import { isLoadable, loadable } from "./loadable";

export type Awaitable<T = any> = Logic<T> | Promise<T> | Loadable<T>;

export type UseFn = {
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

export type UseLogicFn = UseFn & {
  (): LogicAPI & { use: UseFn };
};

/**
 * Retrieve the logic data and re-render it whenever the logic data changes.
 * @param logic
 * @returns
 */
export const useLogic: UseLogicFn = (...args: any[]): any => {
  const manager = useManager();
  const rerender = useState({})[1];
  const { allLogic, unsubscribeAll, update } = useState(() => ({
    allLogic: new Set<Logic>(),
    unsubscribeAll: new Set<VoidFunction>(),
    update: debounce(() => rerender({})),
  }))[0];

  const promises: Promise<unknown>[] = [];
  const api = useMemo(() => {
    return {
      reset: manager.reset,
      delete: manager.delete,
      use(logic: Logic | Logic[]) {
        const isMultiple = Array.isArray(logic);
        const results: unknown[] = [];
        (isMultiple ? logic : [logic]).forEach((x) => {
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
              unsubscribeAll.add(x.onDone(update));
            }
            results.push(x);
            return;
          }

          try {
            allLogic.add(x);
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

        return isMultiple ? results : (results[0] as any);
      },
    };
  }, [manager]);

  allLogic.clear();
  unsubscribeAll.forEach((x) => x());
  unsubscribeAll.clear();

  const result = args.length ? api.use(args[0]) : api;

  useEffect(() => {
    const unsubscribeLogicChange = manager.subscribe((logic) => {
      if (!allLogic.has(logic)) return;
      update();
    });

    return () => {
      unsubscribeLogicChange();
      unsubscribeAll.forEach((x) => x());
    };
  }, [rerender, manager, allLogic]);

  return result;
};
