import { Command } from '@commander-js/extra-typings';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, extname, basename } from 'node:path';
import { URL } from 'node:url';
import assert from 'node:assert';
import { getConfig } from './config.js';

export const cloneCommand = new Command('clone')
  .description('Generates a local copy of a file from a url.')
  .argument('<url>', 'url to copy.')
  .option('--dir <string>', 'source directory where you want to save the document.')
  .action(async (_url, opts) => {
    const config = await getConfig();
    const dir = opts.dir ?? config.rerouteDir;

    // verify that we have a path
    if (!dir) {
      assert.fail(`Source directory not specified`)
    }

    const outputDir = join(process.cwd(), dir);
    const url = new URL(_url);
    const isDocument = !extname(url.pathname);

    // get content
    const res = await fetch(url);
    if (!res.ok) {
      assert.fail(`HTTP error! Status: ${res.status} - ${res.statusText} for URL: ${url}`)
    }
    const html = await res.text();

    if (isDocument) {
      const fileDir = join(outputDir, url.pathname.replace(/^\//, ''));
      const filePath = join(fileDir, 'index.html');
      await mkdir(fileDir, { recursive: true });
      await writeFile(filePath, html, 'utf8');
    }
    else {
      const fileDir = join(outputDir, dirname(url.pathname));
      const filePath = join(fileDir, basename(url.pathname));
      await mkdir(fileDir, { recursive: true });
      await writeFile(filePath, html, 'utf8');
    }
  });
