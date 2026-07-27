import fs from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';

const ENV_KEY = 'SCRATCHPAD_SESSIONS_DIR';

export function createTestSessionsDir() {
  const dir = fs.mkdtempSync(join(os.tmpdir(), 'scratchpad-sessions-'));
  process.env[ENV_KEY] = dir;
  return dir;
}

export function cleanupTestSessionsDir(dir: string) {
  delete process.env[ENV_KEY];
  fs.rmSync(dir, { recursive: true, force: true });
}

export function testSessionsEnv(dir: string) {
  return { ...process.env, [ENV_KEY]: dir };
}
