import { Dispatcher, NO_RESULT } from "./internal";
import { AnyFunc, Logic } from "./types";
import { isPlainObject, isPromiseLike } from "./utils";

const proxyCache = new WeakMap<any, any>();

const createProxy = (value: any) => {
  let proxy = proxyCache.get(value);
  if (proxy) return proxy;
  const callbackCache = new Map<any, { proxy: AnyFunc; origin: AnyFunc }>();

  proxy = new Proxy(value, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value === "function") {
        let cache = callbackCache.get(prop);
        if (!cache) {
          cache = {
            proxy(...args) {
              return cache?.origin(...args);
            },
            origin: value,
          };
          callbackCache.set(prop, cache);
        } else {
          cache.origin = value;
        }
        return cache.proxy;
      }
      return value;
    },
  });

  proxyCache.set(value, proxy);

  return proxy;
};

export const createDispatcher = (
  logic: Logic,
  onLogicChange: (logic: Logic, value: any) => void
): Dispatcher => {
  const originalLogic = logic;
  let prev: any = {};
  const wrapResult = (value: any) => {
    if (!isPlainObject(value)) {
      if (prev !== value) {
        prev = value;
        onLogicChange(logic, value);
      }
      return value;
    }

    // compare non-function values only
    let hasChange = false;
    if (!isPlainObject(prev)) {
      hasChange = true;
    } else {
      const keys = Object.keys(prev).concat(Object.keys(value));
      for (const key of keys) {
        const prevPropValue = prev[key];
        const nextPropValue = value[key];
        if (typeof nextPropValue === "function") {
          if (typeof prevPropValue === "function") {
            continue;
          }
          hasChange = true;
          break;
        }
        if (prevPropValue !== nextPropValue) {
          hasChange = true;
          break;
        }
      }
    }

    const proxy = createProxy(value);

    if (hasChange) {
      onLogicChange(originalLogic, proxy);
    }

    return proxy;
  };

  let promise: Promise<any> | undefined;
  let error: any;
  let wrappedResult: any;
  let hasResult = false;

  const dispatch = () => {
    if (error) throw error;

    // loading lazy logic
    if (promise) return;

    const result = logic();
    // lazy promise
    if (isPromiseLike<any>(result)) {
      promise = result.then(
        (value) => {
          promise = undefined;

          if (typeof value === "function") {
            logic = value as Logic;
          } else if (typeof value.default !== "function") {
            error = new Error("Lazy logic not valid");
          } else {
            logic = value.default as Logic;
          }
        },
        (reason) => {
          error = reason;
          promise = undefined;
        }
      );
      throw promise;
    }

    wrappedResult = wrapResult(result);
    hasResult = true;
  };

  return {
    dispatch,
    result() {
      if (error) throw error;
      if (promise) throw promise;

      if (!hasResult) {
        return NO_RESULT;
      }
      return wrappedResult;
    },
  };
};
