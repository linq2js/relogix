export const NOOP = () => {
  //
};

export const isPromiseLike = <T>(value: any): value is Promise<T> => {
  return value && typeof value.then === "function";
};

export const enqueue = Promise.resolve().then.bind(Promise.resolve());

export const isPlainObject = (
  value: any
): value is Record<string | symbol, any> => {
  if (typeof value !== "object" || value === null) {
    return false; // Not an object or is null
  }

  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true; // `Object.create(null)` case
  }

  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }

  return proto === baseProto;
};

export const debounce = (fn: VoidFunction) => {
  let currentToken = {};
  return () => {
    const prevToken = (currentToken = {});
    enqueue(() => {
      if (prevToken !== currentToken) return;
      fn();
    });
  };
};
