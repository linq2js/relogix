import { Suspense, createElement, memo } from "react";
import { AnyFunc } from "./types";

export type LogicDispatcherProps = {
  name: string;
  dispatch: AnyFunc;
};

const LogicDispatcherInner = memo(function LogicDispatcherInner(
  props: LogicDispatcherProps
) {
  props.dispatch();
  return null;
});

export const LogicDispatcher = memo(function LogicDispatcher(
  props: LogicDispatcherProps
) {
  return createElement(Suspense, {
    fallback: null,
    children: createElement(LogicDispatcherInner, props),
  });
});
