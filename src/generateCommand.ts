import { Command } from '@commander-js/extra-typings';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { writeFile, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

export const generateCommand = new Command('generate')
  .description('Generate files from templates.')
  .addCommand(configCommand);
