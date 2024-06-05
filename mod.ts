import { magenta, debounce } from "./dep.ts";
import { ErowatchInterface, ErowatchOptsInterface, EroEvent, EventCallback } from "./types.ts";
import defaultOptions from "./defaults.ts";

export class Erowatch implements ErowatchInterface {
  #options: ErowatchOptsInterface = defaultOptions;
  #watcher: Deno.FsWatcher | null = null;
  #watcherCallbacks: Map<string, ReturnType<typeof debounce>> = new Map();
  #pathsMap: Map<string, string> = new Map();
  #watching: boolean = false;

  constructor(paths: string | string[], options?: ErowatchOptsInterface) {
    // TODO: ensure 'path' is passed
    if (typeof paths === "string") {
      this.#pathsMap.set(paths, paths);
    } else {
      this.#pathsMap = new Map(paths.map((path) => [path, path]));
    }
    // TODO: Check 'options'
    if (options) this.#options = { ...defaultOptions, ...options };
    this.#init();
  }

  async #init() {
    this.#watcher = Deno.watchFs(Array.from(this.#pathsMap.values()));
    if (!this.#watching) this.#watching = true;
    //console.log(magenta("Started listening from Erowatch..."));
    for await (const event of this.#watcher) {
      const { kind, paths } = event;
      this.#watcherCallbacks.get(kind)?.(paths);
    }
  }

  add(paths: string | string[]): Erowatch {
    if (this.#watching) {
      if (typeof paths === "string") {
        this.#pathsMap.set(paths, paths);
      } else {
        this.#pathsMap = new Map([...this.#pathsMap, ...new Map(paths.map((path) => [path, path]))]);
      }
      this.close();
      this.#init();
    }
    return this;
  }

  on(event: EroEvent, callback: EventCallback): Erowatch {
    this.#watcherCallbacks.set(event, debounce(callback, this.#options.debounce!));
    return this;
  }

  close() {
    if (this.#watching) {
      //console.log(magenta("Closing from close()..."));
      this.#watcher?.close();
      this.#watching = false;
    }
  }

  get watching() {
    return this.#watching;
  }
}
