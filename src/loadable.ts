import { Loadable } from "./types";
import { NOOP } from "./utils";

const LOADABLE_PROP = Symbol("loadable");

/**
 * create loadable object from promise
 * @param promise
 * @returns
 */
export const loadable = <T>(promise: Promise<T>): Loadable<T> => {
  let loadable = (promise as any)[LOADABLE_PROP] as Loadable<T> | undefined;

  if (!loadable) {
    let data: T | undefined;
    let error: any;
    let loading = true;

    promise.then(
      (value) => {
        data = value;
        loading = false;
      },
      (reason) => {
        error = reason;
        loading = false;
      }
    );

    const newLoadable: Loadable<T> = {
      promise,
      get data() {
        return data;
      },
      get loading() {
        return loading;
      },
      get error() {
        return error;
      },
      onDone(callback) {
        if (!loading) {
          callback(newLoadable);
          return NOOP;
        }

        let active = true;
        promise.finally(() => {
          if (!active) return;
          callback(newLoadable);
        });
        return () => {
          active = false;
        };
      },
    };

    Object.assign(promise, { [LOADABLE_PROP]: newLoadable });

    return newLoadable;
  }

  return loadable;
};

export const isLoadable = <T>(value: any): value is Loadable<T> => {
  return value && value.promise && typeof value.onDone === "function";
};
