export type EroEvent = "any" | "access" | "create" | "modify" | "remove" | "other";
export type EventCallback = (path: string[]) => void;
export interface ErowatchOptsInterface {
  debounce?: number;
}

export interface ErowatchInterface {
  isWatching: boolean;
  add: (paths: string | string[]) => Erowatch;
  on: (event: EroEvent, callback: EventCallback) => Erowatch;
  close: () => void;
}
