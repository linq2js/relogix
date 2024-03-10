import { PropsWithChildren, useState } from "react";
import { screen, renderHook, act, waitFor } from "@testing-library/react";
import { Provider, useLogic } from ".";

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

const actDelay = () => act(async () => {});

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
});
