export type EroEvent = "any" | "access" | "create" | "modify" | "remove" | "other";
export type EventCallback = (path: string[]) => void;
export interface ErowatchOptsInterface {
  debounce?: number;
}

export interface ErowatchInterface<T> {
  size: number;
  isWatching: boolean;
  add: (paths: string | string[]) => T;
  on: (event: EroEvent, callback: EventCallback) => T;
  watch: () => T;
  close: () => void;
}
