import { join } from 'node:path';
import { stat } from 'node:fs/promises';

const exists = (path) => stat(path).then(() => true, () => false);

async function importConfig(rootDir) {
  const path = join(rootDir, './scratchpad.config.js');
  if (await exists(path)) {
    return import(path)
      .then(x => x.default)
      .catch(e => {
        console.error(e);
        return {};
      });
  } else {
    return {};
  }
}

export async function getConfig() {
  const rootDir = process.cwd();
  return {
    ...await importConfig(rootDir),
  }
}

