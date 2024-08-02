#!/usr/bin/env node

import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { browser } from '../src/browser.js';
import { getConfig } from '../src/config.js';
import * as esbuild from 'esbuild';

// Get pkg info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();
program
  .argument('<file>', 'file to execute in the browser.')
  .option('--headless [boolean]', 'specify running the browser in headless mode.')
  .option('--devtools [boolean]', 'open browser devtools automatically.')
  .option('--ts-write [boolean]', 'write the js output of the target ts file.')
  .option('--url [string]', 'specify a specific url to execute the code in.')
  .version(pkg.version)
program.parse(process.argv);

const file = program.args.at(0);
const config = await getConfig();
const opts = { ...config, ...program.opts()};

export class Processor extends EventTarget {
  url = opts['url'];
  headless = opts['headless'];
  devtools = opts['devtools'];
  tsWrite = opts['tsWrite'];
  playwrightConfig = opts['playwright'];
  _func = '';

  constructor() {
    super();
    this.watcher();
    browser(this);
  }

  get func() {
    return this._func;
  }

  set func(func) {
    this._func = func;
    this.dispatchEvent(new Event('change'));
  }

  watcher() {
    if (!file) {
      throw new Error(`${file} file not found.`);
    }
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
        if (this.tsWrite) {
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
    this.dispatchEvent(new Event('change'));
  }
}

new Processor();
