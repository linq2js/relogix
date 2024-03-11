import { equal } from "@wry/equality";
import { AnyFunc, Logic, LogicResult, NoInfer } from "./types";
import { isPromiseLike } from "./utils";

export type VariantFn = {
  <TVariables, TResult>(
    logic:
      | ((variables: TVariables) => LogicResult<TResult>)
      | (() => Promise<
          | ((variables: TVariables) => LogicResult<TResult>)
          | { default: (variables: TVariables) => LogicResult<TResult> }
        >),
    variables: NoInfer<TVariables>
  ): Logic<TResult>;

  <TVariables, TResult>(
    logic:
      | ((variables: TVariables) => LogicResult<TResult>)
      | (() => Promise<
          | ((variables: TVariables) => LogicResult<TResult>)
          | { default: (variables: TVariables) => LogicResult<TResult> }
        >)
  ): Logic<TResult>[];
};

const logicCache = new WeakMap<AnyFunc, { variant: any; logic: Logic }[]>();

export const variant: VariantFn = (logic, ...args: any[]): any => {
  let logicList = logicCache.get(logic);

  if (!args.length) {
    return logicList?.map((x) => x.logic) ?? [];
  }

  const variables = args[0];

  if (!logicList) {
    logicList = [];
    logicCache.set(logic, logicList);
  }
  const index = logicList.findIndex((x) => equal(x.variant, variables));
  if (index === -1) {
    const newLogicWithVariant = (): any => {
      const result = logic(variables);
      if (isPromiseLike(result)) {
        return result.then((resolved: any) => {
          const fn =
            typeof resolved === "function"
              ? resolved
              : resolved && typeof resolved.default === "function"
              ? resolved.default
              : () => resolved;

          return () => fn(variables);
        });
      }

      return result;
    };
    logicList.push({ variant: variables, logic: newLogicWithVariant });
    return newLogicWithVariant;
  }

  return logicList[index].logic;
};
