#!/usr/bin/env node

import fs from 'node:fs';
import { join } from 'node:path';
import { Command, Option } from 'commander';
import { browser } from  '../src/browser.js';

const program = new Command();
program
  .argument('<file>', 'file to execute in the browser.')
  .option('--headless [boolean]', 'specify running the browser in headless mode');
program.parse(process.argv);

const file = program.args.at(0);
const opts = program.opts();
const headless = 'headless' in opts ? 'new' : false;

if (fs.existsSync(file)) {
  const func = fs.readFileSync(file, 'utf8');
  browser(func, { headless });
}
else {
  console.error(`${file} file not found.`)
}

// if (process.argv.includes('clean')) {
//   await builder.clean();
// } else if (process.argv.includes('build')) {
//   try {
//     await builder.build();
//   } catch(e) {
//     console.error(e);
//     process.exit(1);
//   }
// } else {
//   console.log('USAGE: dx-cdn <build|clean>');
// }
