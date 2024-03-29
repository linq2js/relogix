import { PropsWithChildren, useState } from "react";
import { screen, renderHook, act } from "@testing-library/react";
import { Provider, useLogic } from ".";
import { loadable } from "./loadable";
import { variant } from "./variant";

const log = jest.fn();

const CounterLogic = () => {
  log("CounterLogic");

  const [count, setCount] = useState(0);

  return {
    count,
    increment() {
      setCount(count + 1);
    },
  };
};

const CounterLogicWithVariant = (step: number = 1) => {
  log("CounterLogic");

  const [count, setCount] = useState(0);

  return {
    count,
    increment() {
      setCount(count + step);
    },
  };
};

const DoubledCounterLogic = () => {
  const { count, increment } = useLogic(CounterLogic);
  return { count: count * 2, increment };
};

const CounterLogicLazy = () => Promise.resolve(CounterLogic);

const LOADING = <div>loading</div>;
const preload: any[] = [];
const wrapper = (props: PropsWithChildren) => {
  return (
    <Provider fallback={LOADING} preload={preload}>
      {props.children}
    </Provider>
  );
};

const counterTest = () => renderHook(() => useLogic(CounterLogic), { wrapper });

const actDelay = (ms: number = 0) =>
  act(() => new Promise((resolve) => setTimeout(resolve, ms)));

beforeEach(() => {
  log.mockRestore();
  preload.length = 0;
});

describe("basic usages", () => {
  test("simple logic", async () => {
    const { result, rerender } = counterTest();
    // Initially, the logic must be loaded asynchronously.
    screen.getByText("loading");
    await actDelay();
    expect(result.current.count).toBe(0);
    expect(log).toHaveBeenCalledTimes(1);
    // Even if the component re-renders multiple times, the hook result remains consistent with the previous one.
    rerender();
    rerender();
    rerender();
    expect(log).toHaveBeenCalledTimes(1);
    // When the component's state changes, the hook result should change accordingly.
    act(() => result.current.increment());
    await actDelay();
    expect(result.current.count).toBe(1);
    expect(log).toHaveBeenCalledTimes(2);
  });
});

describe("advanced usages", () => {
  test("preload logic", async () => {
    preload.push(CounterLogic);
    const { result, rerender } = counterTest();
    // There is no need to wait for `CounterLogic` to load, as it is preloaded by the `Provider`.
    expect(result.current.count).toBe(0);
    expect(log).toHaveBeenCalledTimes(1);
    // Even if the component re-renders multiple times, the hook result remains consistent with the previous one.
    rerender();
    rerender();
    rerender();
    expect(log).toHaveBeenCalledTimes(1);
    // When the component's state changes, the hook result should change accordingly.
    act(() => result.current.increment());
    await actDelay();
    expect(result.current.count).toBe(1);
    expect(log).toHaveBeenCalledTimes(2);
  });

  test("lazy logic", async () => {
    const { result, rerender } = renderHook(() => useLogic(CounterLogicLazy), {
      wrapper,
    });
    // Initially, the logic must be loaded asynchronously.
    screen.getByText("loading");
    await actDelay();
    expect(result.current.count).toBe(0);
    expect(log).toHaveBeenCalledTimes(1);
    // Even if the component re-renders multiple times, the hook result remains consistent with the previous one.
    rerender();
    rerender();
    rerender();
    expect(log).toHaveBeenCalledTimes(1);
    // When the component's state changes, the hook result should change accordingly.
    act(() => result.current.increment());
    await actDelay();
    expect(result.current.count).toBe(1);
    expect(log).toHaveBeenCalledTimes(2);
  });

  test("multiple level lazy logic", async () => {
    const lazyValue = async () => () => Promise.resolve(() => ({ data: 1 }));
    const { result } = renderHook(() => useLogic(lazyValue), { wrapper });
    screen.getByText("loading");
    await actDelay();
    expect(result.current.data).toBe(1);
  });

  test("lazy value", async () => {
    const lazyValue = async () => ({ data: 1 });
    const { result } = renderHook(() => useLogic(lazyValue), { wrapper });
    screen.getByText("loading");
    await actDelay();
    expect(result.current.data).toBe(1);
  });

  test("dependency logic", async () => {
    const { result, rerender } = renderHook(
      () => useLogic(DoubledCounterLogic),
      { wrapper }
    );
    // Initially, the logic must be loaded asynchronously.
    screen.getByText("loading");
    await actDelay();
    expect(result.current.count).toBe(0);
    await actDelay();
    expect(log).toHaveBeenCalledTimes(1);
    // Even if the component re-renders multiple times, the hook result remains consistent with the previous one.
    rerender();
    rerender();
    rerender();
    expect(log).toHaveBeenCalledTimes(1);
    // When the component's state changes, the hook result should change accordingly.
    act(() => result.current.increment());
    await actDelay();
    expect(result.current.count).toBe(2);
    expect(log).toHaveBeenCalledTimes(2);
  });

  test("reset", async () => {
    const { result, rerender } = renderHook(
      () => {
        const counter = useLogic(CounterLogic);
        const { reset } = useLogic();
        return {
          ...counter,
          reset,
        };
      },
      { wrapper }
    );
    // Initially, the logic must be loaded asynchronously.
    screen.getByText("loading");
    await actDelay();
    expect(result.current.count).toBe(0);
    expect(log).toHaveBeenCalledTimes(1);
    // Even if the component re-renders multiple times, the hook result remains consistent with the previous one.
    rerender();
    rerender();
    rerender();
    expect(log).toHaveBeenCalledTimes(1);
    // When the component's state changes, the hook result should change accordingly.
    act(() => result.current.increment());
    await actDelay();
    expect(result.current.count).toBe(1);
    expect(log).toHaveBeenCalledTimes(2);
    act(() => {
      result.current.reset(CounterLogic);
    });
    await actDelay();
    expect(result.current.count).toBe(0);
  });
});

describe("useLogic", () => {
  test("loadable", async () => {
    const l1 = loadable(Promise.resolve(1));
    const { result } = renderHook(() => useLogic(l1), { wrapper });
    expect(result.current.data).toBeUndefined();
    await actDelay();
    expect(result.current.data).toBe(1);
  });

  test("promise", async () => {
    const p = Promise.resolve(1);
    const { result } = renderHook(() => useLogic(p), { wrapper });
    expect(result.current).toBeNull();
    await actDelay();
    expect(result.current).toBe(1);
  });
});

describe("withVariant", () => {
  test("sync logic", async () => {
    const t1 = renderHook(() => useLogic(variant(CounterLogicWithVariant, 1)), {
      wrapper,
    });
    screen.getByText("loading");
    await actDelay();
    expect(t1.result.current.count).toBe(0);
    act(() => t1.result.current.increment());
    await actDelay();
    expect(t1.result.current.count).toBe(1);

    const t2 = renderHook(() => useLogic(variant(CounterLogicWithVariant, 2)), {
      wrapper,
    });
    screen.getByText("loading");
    await actDelay();
    expect(t2.result.current.count).toBe(0);
    act(() => t2.result.current.increment());
    await actDelay();
    expect(t2.result.current.count).toBe(2);
  });

  test("async logic", async () => {
    const AsyncCounterLogicWithVariant = () =>
      Promise.resolve(CounterLogicWithVariant);
    const t1 = renderHook(
      () => useLogic(variant(AsyncCounterLogicWithVariant, 1)),
      { wrapper }
    );
    screen.getByText("loading");
    await actDelay();
    expect(t1.result.current.count).toBe(0);
    act(() => t1.result.current.increment());
    await actDelay();
    expect(t1.result.current.count).toBe(1);

    const t2 = renderHook(
      () => useLogic(variant(AsyncCounterLogicWithVariant, 2)),
      { wrapper }
    );
    screen.getByText("loading");
    await actDelay();
    expect(t2.result.current.count).toBe(0);
    act(() => t2.result.current.increment());
    await actDelay();
    expect(t2.result.current.count).toBe(2);
  });
});
