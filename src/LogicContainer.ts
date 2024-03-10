import { memo, useLayoutEffect, useRef, useState } from "react";
import { useManager } from "./useManager";

export const LogicContainer = memo(function LogicContainer() {
  const manager = useManager();
  const dynamicLogic = manager.dynamicLogic;
  const mountedRef = useRef(false);
  const rerender = useState(() => {
    let prevLength = dynamicLogic.length;
    manager.onLogicAdded(() => {
      if (!mountedRef.current) return;
      if (prevLength === dynamicLogic.length) return;
      prevLength = dynamicLogic.length;
      rerender({});
    });
    return {};
  })[1];

  useLayoutEffect(() => {
    mountedRef.current = true;
  });

  return dynamicLogic;
});
