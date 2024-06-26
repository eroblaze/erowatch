import { debounce } from "./dep.ts";
import type { ErowatchInterface, ErowatchOptsInterface, EroEvent, EventCallback } from "./types.ts";
import defaultOptions from "./defaults.ts";

export class Erowatch implements ErowatchInterface<Erowatch> {
  #options: ErowatchOptsInterface = defaultOptions;
  #watcher: Deno.FsWatcher | null = null;
  #watcherCallbacks: Map<string, ReturnType<typeof debounce>> = new Map();
  #pathsMap: Map<string, string> = new Map();
  #isWatching: boolean = false;
  #wasPathPassed: boolean = true;

  constructor(paths?: string | string[], options?: ErowatchOptsInterface) {
    // TODO: ensure 'path' is passed
    if (!paths) {
      this.#wasPathPassed = false;
    } else if (typeof paths === "string" || Array.isArray(paths)) {
      if (typeof paths === "string") this.#pathsMap.set(paths, paths);
      else {
        this.#pathsMap = new Map(paths.map((path) => [path, path]));
      }
      this.#init();
    } else {
      // TODO: work on this
      throw new Error("invalid argument for 'paths'");
    }
    // TODO: Check 'options'
    if (options) this.#options = { ...defaultOptions, ...options };
  }

  async #init() {
    this.#watcher = Deno.watchFs(Array.from(this.#pathsMap.values()));
    if (!this.#isWatching) this.#isWatching = true;
    //console.log(magenta("Started listening from Erowatch..."));
    for await (const event of this.#watcher) {
      const { kind, paths } = event;
      this.#watcherCallbacks.get(kind)?.(paths);
    }
  }

  add(paths: string | string[]): Erowatch {
    if (this.#isWatching) {
      // To prevent unnecessary stopping and starting of the process, make sure a new path was added before calling this.#init()
      const prevSize = this.#pathsMap.size;
      if (typeof paths === "string") {
        this.#pathsMap.set(paths, paths);
      } else {
        this.#pathsMap = new Map([...this.#pathsMap, ...new Map(paths.map((path) => [path, path]))]);
      }
      if (this.#pathsMap.size > prevSize) {
        this.close();
        this.#init();
      }
    } else {
      if (typeof paths === "string") {
        this.#pathsMap.set(paths, paths);
      } else {
        this.#pathsMap = new Map([...this.#pathsMap, ...new Map(paths.map((path) => [path, path]))]);
      }
    }
    return this;
  }

  on(event: EroEvent, callback: EventCallback): Erowatch {
    this.#watcherCallbacks.set(event, debounce(callback, this.#options.debounce!));
    return this;
  }

  watch(): Erowatch {
    // Consider adding !this.#wasPathPassed to the check below
    if (!this.#isWatching) {
      this.#init();
    }
    return this;
  }

  unwatch(paths: string | string[]): Erowatch {
    // Some validations
    this.close();
    let cnt = 1;
    const wasWatching = this.isWatching;
    if (Array.isArray(paths)) cnt = paths.length;

    for (let i = 0; i < cnt; i++) {
      const path = Array.isArray(paths) ? paths[i] : paths;
      this.#pathsMap.delete(path);
    }

    if (wasWatching) this.#init();

    return this;
  }

  get isWatching(): boolean {
    return this.#isWatching;
  }

  get size(): number {
    return this.#pathsMap.size;
  }

  close() {
    if (this.#isWatching) {
      //console.log(magenta("Closing from close()..."));
      this.#watcher?.close();
      this.#isWatching = false;
    }
  }
}
