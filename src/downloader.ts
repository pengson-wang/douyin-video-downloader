import * as path from "https://deno.land/std@0.144.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.144.0/node/fs/promises.ts";
import { copy } from "https://deno.land/std@0.144.0/streams/conversion.ts";

enum WorkerState {
  initialized,
  pending,
  rejected,
  resolved,
}

type AsyncJobFn = () => () => Promise<void>;

export class Worker {
  state: WorkerState;
  jobFn: AsyncJobFn;
  constructor(jobFn: AsyncJobFn) {
    this.jobFn = jobFn;
    this.state = WorkerState.initialized;
  }
  async start() {
    this.state = WorkerState.pending;
    try {
      const job = this.jobFn();
      await job();
      this.state = WorkerState.resolved;
    } catch (_) {
      this.state = WorkerState.rejected;
    }
  }
}

export interface Target {
  filename: string;
  url: string;
}

export class Downloader {
  dir: string;
  max: number;

  _urls: Array<Target> = [];
  _workers: Array<Worker> = [];
  _urls_interval: number | undefined;
  _workers_interval: number | undefined;
  constructor(dir: string, max = 5) {
    this.dir = dir;
    this.max = max;
  }
  add(...targets: Target[]) {
    console.log(`before add: ${this._urls.length}`);
    Array.prototype.push.call(this._urls, ...targets);
    console.log(`after added: ${this._urls.length}`);
  }
  batchAdd(targets: Target[]) {
    Array.prototype.push.apply(this._urls, targets);
  }
  async download(url: string, filename: string, force = false) {
    console.log("Entering Download");
    if (!force) {
      try {
        const stats = await fs.stat(path.joinGlobs([this.dir, filename]));
        if (stats.isFile()) {
          console.log(
            `Skiped since file[${filename}] already exists, url[${url}]`
          );
          return;
        }
      } catch (_) {
        // console.warn(err)
      }
    }
    console.log(
      `Downloading ${url} to ${path.joinGlobs([this.dir, filename])}`
    );
    try {
      const resp = await fetch(url, {
        headers: {
          ["User-Agent"]:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.9999.0 Safari/537.36",
        },
      });
      if (resp.ok) {
        const file = await Deno.create(path.joinGlobs([this.dir, filename]));
        if (resp.body) {
          const reader = resp.body.getReader();
          //@ts-ignore type incompatile in core
          await copy(reader, file);
        }
      } else {
        console.warn(resp.statusText);
        throw new Error(resp.statusText);
      }
    } catch (err) {
      console.warn(err);
      return Promise.reject(2);
    }
  }
  async start() {
    try {
      const stats = await fs.stat(this.dir);
      if (!stats.isDirectory()) {
        await fs.mkdir(this.dir, { recursive: true });
      }
    } catch (_) {
      await fs.mkdir(this.dir, { recursive: true });
    }

    this._urls_interval = setInterval(() => {
      console.info(
        `workers.length=${this._workers.length} urls.length=${this._urls.length}`
      );
      if (this._workers.length < this.max) {
        const target = this._urls.shift();
        if (target) {
          const { url, filename } = target;
          const worker = new Worker(() => async () => {
            console.log("job started");
            return await this.download(url, filename);
          });
          this._workers.push(worker);
        }
      }
    }, 500);
    this._workers_interval = setInterval(() => {
      console.info(
        `workers.length=${this._workers.length} urls.length=${this._urls.length}`
      );
      for (const worker of this._workers) {
        if (worker.state === WorkerState.initialized) {
          console.log("starting worker");
          worker.start();
        } else if (worker.state === WorkerState.rejected) {
          //TODO: retry n times
          this._workers.splice(this._workers.indexOf(worker), 1);
        } else if (worker.state === WorkerState.resolved) {
          this._workers.splice(this._workers.indexOf(worker), 1);
        } else {
          console.warn(`unknown worker state:${worker.state}`);
        }
      }
    }, 2000);
  }

  hasIncompletedJobs() {
    return (
      this._workers.some(
        (worker) =>
          worker.state === WorkerState.pending ||
          worker.state === WorkerState.initialized
      ) || this._urls.length > 0
    );
  }

  pause() {
    clearInterval(this._urls_interval);
    clearInterval(this._workers_interval);
  }

  stop() {
    clearInterval(this._urls_interval);
    clearInterval(this._workers_interval);
  }
}
