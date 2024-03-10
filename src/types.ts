export type AnyFunc = (...args: any[]) => any;

export type NoInfer<T> = [T][T extends any ? 0 : never];

export type Equal<T = unknown> = (a: T, b: T) => boolean;

export type LogicResult<T> = T | Promise<{ default: Logic<T> } | Logic<T> | T>;

export type Logic<T = any> = () => LogicResult<T>;

export interface Loadable<T> {
  readonly data: T | undefined;
  readonly error: any;
  readonly loading: boolean;
  readonly promise: Promise<T>;
  onDone(listener: (loadable: this) => void): VoidFunction;
}

export type LogicAPI = {
  delete(logic: Logic | Logic[]): void;

  reset(logic: Logic | Logic[]): void;
};
