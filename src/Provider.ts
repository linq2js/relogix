import {
  PropsWithChildren,
  ReactNode,
  Suspense,
  createElement,
  memo,
  useContext,
  useState,
} from "react";
import { Logic } from "./types";
import { LogicManager, managerContext } from "./internal";
import { createManager } from "./createManager";
import { NOOP } from "./utils";
import { LogicDispatcher } from "./LogicDispatcher";
import { LogicContainer } from "./LogicContainer";

export type ProviderProps = {
  preload?: Logic[];
  fallback: ReactNode;
};

export const Provider = memo(function Provider(
  props: PropsWithChildren<ProviderProps>
) {
  const parentManager = useContext(managerContext);
  const [manager] = useState<LogicManager>(
    () => parentManager || createManager(NOOP)
  );

  const preloadLogic: ReactNode[] = [];
  props.preload?.forEach((logic, key) => {
    const dispatcher = manager.getDispatcher(logic);
    preloadLogic.push(
      createElement(LogicDispatcher, {
        name: logic.name,
        dispatch: dispatcher.dispatch,
        key,
      })
    );
  });

  return createElement(
    managerContext.Provider,
    { value: manager },
    preloadLogic,
    parentManager ? null : createElement(LogicContainer),
    createElement(Suspense, {
      fallback: props.fallback,
      children: props.children,
    })
  );
});

/**
 * Provider
 *  PreloadLogic
 *    Logic1
 *    Logic2
 *  DynamicLogic
 *    Logic1
 *    Logic2
 *  Suspense
 *    Children
 */
