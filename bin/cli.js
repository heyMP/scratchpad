#!/usr/bin/env node

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { Command } from 'commander';
import { browser } from '../src/browser.js';

const program = new Command();
program
  .argument('<file>', 'file to execute in the browser.')
  .option('--headless [boolean]', 'specify running the browser in headless mode.')
  .option('--watch [boolean]', 'rerun the file on change.');
program.parse(process.argv);

const file = program.args.at(0);
const opts = program.opts();
const browserOptions = {
  headless: 'headless' in opts ? 'new' : false
};

class Processor extends EventTarget {
  constructor() {
    super();
    if ('watch' in opts) {
      fs.watchFile(file, {interval: 100}, () => {
        this.dispatchEvent(new Event('change'));
      });
    }
    browser(this, { ...browserOptions });
  }

  get func() {
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf8');
    }
    else {
      console.error(`${file} file not found.`)
    }
  }

  start() {
    this.dispatchEvent(new Event('change'));
  }
}

new Processor();
