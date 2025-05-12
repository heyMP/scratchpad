import { Command } from '@commander-js/extra-typings';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { URL } from 'node:url';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import { login } from './login.js';
import { getConfig } from './config.js';
import { Processor } from './Processor.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configCommand = new Command('config')
  .description('Generates an example config file.')
  .action(async () => {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const template = await readFile(join(__dirname, '../templates/scratchpad.config.js'), 'utf8');
    const outpath = join(process.cwd(), 'scratchpad.config.js');
    const confirmation = await rl.question(`Are you sure you want to create the following
${outpath} [Y/n]: `);

    // if the user answers no then abort
    if (['n', 'N'].includes(confirmation)) {
      rl.close();
      return;
    }

    // write the template file to the users directory
    writeFile(outpath, template, 'utf8');
    rl.close();
  });

const documentCommand = new Command('document')
  .description('Generates a local copy of a document from a url.')
  .argument('<url>', 'url to copy.')
  .argument('<dir>', 'source directory where you want to save the document.')
  .action(async (_url, dir) => {
    const outputDir = join(process.cwd(), dir);
    const url = new URL(_url);

    // get html
    const res = await fetch(url);
    if (!res.ok) {
      assert.fail(`HTTP error! Status: ${res.status} - ${res.statusText} for URL: ${url}`)
    }
    const html = await res.text();

    // save file
    const fileDir = join(outputDir, url.pathname.replace(/^\//, ''));
    const filePath = join(fileDir, 'index.html');
    await mkdir(fileDir, { recursive: true });
    await writeFile(filePath, html, 'utf8');
  });

const loginCommand = new Command('login')
  .description('Launches a session and saves the browser session in a local file on termination.')
  .action(async (...options) => {
    const config = await getConfig();
    const opts = { ...config, options };
    login({
      // type narrow the options
      devtools: !!opts['devtools'],
      url: typeof opts['url'] === 'string' ? opts['url'] : undefined,
    });
  });

export const generateCommand = new Command('generate')
  .description('Generate files from templates.')
  .addCommand(configCommand)
  .addCommand(documentCommand)
  .addCommand(loginCommand);
