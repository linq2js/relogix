import { memo, useLayoutEffect, useRef, useState } from "react";
import { useManager } from "./useManager";

export const LogicContainer = memo(function LogicContainer() {
  const manager = useManager();
  const dynamicLogic = manager.lazyLogic;
  const mountedRef = useRef(false);
  const rerender = useState(() => {
    manager.onLogicAdded(() => {
      if (!mountedRef.current) return;
      rerender({});
    });
    return {};
  })[1];

  useLayoutEffect(() => {
    mountedRef.current = true;
  });

  return dynamicLogic;
});
