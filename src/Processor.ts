import fs from 'node:fs';
import { join } from 'node:path';
import * as esbuild from 'esbuild';

export class ProcessorChangeEvent extends Event {
  constructor() {
    super('change');
  }
}

export type ProcessorOpts = {
  headless?: boolean;
  devtools?: boolean;
  tsWrite?: boolean;
  url?: string;
  playwright?: any;
  file: string;
}

/**
 * Event Bus that monitors the target file for
 * changes and emits stringified javascript to
 * throught the 'change' event.
 * */
export class Processor extends EventTarget {
  _func = '';

  constructor(public opts: ProcessorOpts) {
    super();
    this.watcher();
  }

  get func() {
    return this._func;
  }

  set func(func) {
    this._func = func;
    this.dispatchEvent(new ProcessorChangeEvent());
  }

  watcher() {
    const file = this.opts.file;
    if (!fs.existsSync(file)) {
      throw new Error(`${file} file not found.`);
    }
    // execute it immediately then start watcher
    this.build();
    fs.watchFile(join(file), { interval: 100 }, () => {
      this.build();
    });
  }

  async build() {
    const file = this.opts.file;
    try {
      if (!file) {
        throw new Error(`${file} file not found.`);
      }
      if (file.endsWith('.ts')) {
        const { outputFiles: [stdout]} = await esbuild.build({
          entryPoints: [file],
          format: 'esm',
          bundle: true,
          write: false,
        });
        this.func = new TextDecoder().decode(stdout.contents);
        if (this.opts.tsWrite) {
          fs.writeFile(join(process.cwd(), file.replace(/\.ts$/g, '.js')), this.func, 'utf8', () => {});
        }
      }
      else {
        this.func = fs.readFileSync(file, 'utf8');
      }
    } catch (e) {
      console.error(e);
    }
  }

  start() {
    this.dispatchEvent(new ProcessorChangeEvent());
  }
}
