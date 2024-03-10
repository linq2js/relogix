import { useEffect, useRef, useState } from "react";
import { Logic } from "./types";
import { useManager } from "./useManager";
import { debounce, isPromiseLike } from "./utils";

/**
 * Retrieve the logic data and re-render it whenever the logic data changes.
 * @param logic
 * @returns
 */
export const useLogic = <const T extends Logic | readonly Logic[]>(
  logic: T
): T extends Logic<infer R>
  ? R
  : { [key in keyof T]: T[key] extends Logic<infer R> ? R : never } => {
  const manager = useManager();
  const rerender = useState({})[1];
  const isMultiple = Array.isArray(logic);
  const logicList: Logic[] = isMultiple ? logic : [logic];
  const results: unknown[] = [];
  const promises: Promise<unknown>[] = [];
  logicList.forEach((x) => {
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
    const update = debounce(() => rerender({}));
    return manager.subscribe((logic) => {
      if (!logicRef.current.includes(logic)) return;
      update();
    });
  }, [rerender, manager]);

  return isMultiple ? results : (results[0] as any);
};
