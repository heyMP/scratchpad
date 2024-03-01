#!/usr/bin/env node

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { browser } from '../src/browser.js';

// Get pkg info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();
program
  .argument('<file>', 'file to execute in the browser.')
  .option('--headless [boolean]', 'specify running the browser in headless mode.')
  .option('--url [string]', 'specify a specific url to execute the code in.')
  .version(pkg.version)
program.parse(process.argv);

const file = program.args.at(0);
const opts = program.opts();

class Processor extends EventTarget {
  constructor() {
    super();
    this.url = opts['url'];
    this.headless = 'headless' in opts ? 'new' : false
    this._func = '';

    if (file.endsWith('.ts')) {
      this.startTsWatcher();
    }
    else {
      this.startFileWatcher();
    }

    browser(this);
  }

  get func() {
    return this._func;
  }

  set func(func) {
    this._func = func;
    this.dispatchEvent(new Event('change'));
  }

  startTsWatcher() {
    // start a watcher
    const tscCommand = spawn('npx', ['tsc', file, '-w', '--outFile', '/dev/stdout'], { cwd: process.cwd() });
    tscCommand.stdout.on('data', data => {
      const output = data.toString();
      if (output.includes('Starting') || output.includes('Watching for file changes')) {
        return;
      };
      this.func = output;
    })
    tscCommand.stderr.on('data', data => {
      console.error('error', data.toString());
    });
  }

  startFileWatcher() {
    fs.watchFile(file, { interval: 100 }, () => {
      if (fs.existsSync(file)) {
        this.func = fs.readFileSync(file, 'utf8');
      }
      else {
        console.error(`${file} file not found.`)
      }
    });
  }

  start() {
    this.dispatchEvent(new Event('change'));
  }
}

new Processor();
