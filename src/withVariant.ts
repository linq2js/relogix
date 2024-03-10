import { equal } from "@wry/equality";
import { AnyFunc, Logic, LogicResult, NoInfer } from "./types";
import { isPromiseLike } from "./utils";

const logicCache = new WeakMap<AnyFunc, { variant: any; logic: Logic }[]>();
export const withVariant = <TVariant, TResult>(
  logic:
    | ((variant: TVariant) => LogicResult<TResult>)
    | (() => Promise<
        | ((variant: TVariant) => LogicResult<TResult>)
        | { default: (variant: TVariant) => LogicResult<TResult> }
      >),
  variant: NoInfer<TVariant>
): Logic<TResult> => {
  let logicList = logicCache.get(logic);
  if (!logicList) {
    logicList = [];
    logicCache.set(logic, logicList);
  }
  const index = logicList.findIndex((x) => equal(x.variant, variant));
  if (index === -1) {
    const newLogicWithVariant = (): any => {
      const result = logic(variant);
      if (isPromiseLike(result)) {
        return result.then((resolved: any) => {
          const fn =
            typeof resolved === "function"
              ? resolved
              : resolved && typeof resolved.default === "function"
              ? resolved.default
              : () => resolved;

          return () => fn(variant);
        });
      }

      return result;
    };
    logicList.push({ variant, logic: newLogicWithVariant });
    return newLogicWithVariant;
  }

  return logicList[index].logic;
};
