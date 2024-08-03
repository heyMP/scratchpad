#!/usr/bin/env node

import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from '@commander-js/extra-typings';
import { runCommand } from './runCommand.js';

// Get pkg info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();
program
  .description(pkg.description)
  .version(pkg.version);
program.addCommand(runCommand);
program.parse(process.argv);
