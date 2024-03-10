export type AnyFunc = (...args: any[]) => any;

export type NoInfer<T> = [T][T extends any ? 0 : never];

export type Equal<T = unknown> = (a: T, b: T) => boolean;

export type Logic<T = any> = () =>
  | T
  | Promise<{ default: () => T } | (() => T)>;

export interface Loadable<T> {
  readonly data: T | undefined;
  readonly error: any;
  readonly loading: boolean;
  readonly promise: Promise<T>;
  onDone(listener: (loadable: this) => void): VoidFunction;
}
