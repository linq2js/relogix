import { memo, useLayoutEffect, useRef, useState } from "react";
import { useManager } from "./useManager";
import { debounce } from "./utils";

export const LogicContainer = memo(function LogicContainer() {
  const manager = useManager();
  const lazyLogic = manager.lazyLogic;
  const mountedRef = useRef(false);
  const rerender = useState(() => {
    const update = debounce(() => rerender({}));
    manager.onLogicChanged(update);
    return {};
  })[1];

  useLayoutEffect(() => {
    mountedRef.current = true;
  });

  return lazyLogic;
});
