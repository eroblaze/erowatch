import { magenta, debounce } from "./dep.ts";
import { ErowatchInterface, ErowatchOptsInterface, EroEvent, EventCallback } from "./types.ts";
import defaultOptions from "./defaults.ts";

export class Erowatch implements ErowatchInterface {
  #options: ErowatchOptsInterface = defaultOptions;
  #watcher: Deno.FsWatcher | null = null;
  #watcherCallbacks: Map<string, ReturnType<typeof debounce>> = new Map();
  #pathsMap: Map<string, string> = new Map();
  #isWatching: boolean = false;

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
    }
    return this;
  }

  on(event: EroEvent, callback: EventCallback): Erowatch {
    this.#watcherCallbacks.set(event, debounce(callback, this.#options.debounce!));
    return this;
  }

  close() {
    if (this.#isWatching) {
      //console.log(magenta("Closing from close()..."));
      this.#watcher?.close();
      this.#isWatching = false;
    }
  }

  get isWatching() {
    return this.#isWatching;
  }
}
