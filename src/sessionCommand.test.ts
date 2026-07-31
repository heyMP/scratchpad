import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSessionPath, getSessionsDir } from './utils.js';
import { cleanupTestSessionsDir, createTestSessionsDir, testSessionsEnv } from './testHelpers.js';

const testDir = dirname(fileURLToPath(import.meta.url));
let sessionsDir: string;

function runSessionDelete(args: string[], env: Record<string, string | undefined>) {
  const script = `
    import { sessionCommand } from './sessionCommand.js';
    await sessionCommand.parseAsync(['node', 'session', 'delete', ...${JSON.stringify(args)}]);
  `;
  return spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: testDir,
    encoding: 'utf8',
    env,
  });
}

describe('session delete', () => {
  before(() => {
    sessionsDir = createTestSessionsDir();
    fs.mkdirSync(getSessionsDir(), { recursive: true });
  });

  after(() => {
    cleanupTestSessionsDir(sessionsDir);
  });

  test('deletes a single session with --force', () => {
    const sessionPath = getSessionPath('del-one');
    fs.writeFileSync(sessionPath, '{}');

    const result = runSessionDelete(['del-one', '--force'], testSessionsEnv(sessionsDir));
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Deleted session "del-one"'));
    assert.ok(!fs.existsSync(sessionPath));
  });

  test('deletes multiple sessions with --force', () => {
    fs.writeFileSync(getSessionPath('del-a'), '{}');
    fs.writeFileSync(getSessionPath('del-b'), '{}');

    const result = runSessionDelete(['del-a', 'del-b', '--force'], testSessionsEnv(sessionsDir));
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Deleted 2 sessions'));
    assert.ok(!fs.existsSync(getSessionPath('del-a')));
    assert.ok(!fs.existsSync(getSessionPath('del-b')));
  });

  test('duplicate names are deduplicated and do not cause errors', () => {
    fs.writeFileSync(getSessionPath('dup-test'), '{}');

    const result = runSessionDelete(['dup-test', 'dup-test', 'dup-test', '--force'], testSessionsEnv(sessionsDir));
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Deleted session "dup-test"'));
    assert.ok(!fs.existsSync(getSessionPath('dup-test')));
  });

  test('errors when session does not exist', () => {
    const result = runSessionDelete(['nonexistent', '--force'], testSessionsEnv(sessionsDir));
    assert.notStrictEqual(result.status, 0);
  });
});
