import { test, describe, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveSessionFromContext } from './login.js';
import {
  getSessionPath,
  getSessionsDir,
  listSessions,
  OperationCancelledError,
} from './utils.js';

const testDir = dirname(fileURLToPath(import.meta.url));

function createMockContext() {
  return {
    storageState: async ({ path }: { path: string }) => {
      fs.writeFileSync(path, '{"cookies":[],"origins":[]}');
    },
  };
}

function runSaveSessionFromContext(input: string) {
  const script = `
    import { saveSessionFromContext } from './login.js';

    const context = {
      storageState: async ({ path }) => {
        await import('node:fs/promises').then(({ writeFile }) =>
          writeFile(path, '{"cookies":[],"origins":[]}')
        );
      },
    };

    try {
      await saveSessionFromContext(context);
      process.stdout.write('saved');
    } catch (error) {
      process.stdout.write(error.name);
    }
  `;

  return spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: testDir,
    input,
    encoding: 'utf8',
  });
}

async function getSessionSelectionInput(sessionName: string) {
  const sessions = await listSessions();
  const index = sessions.findIndex((session) => session.name === sessionName);
  assert.notStrictEqual(index, -1, `Session "${sessionName}" not found in picker options`);
  return `${index + 2}\n`;
}

describe('saveSessionFromContext', () => {
  const newSessionName = 'login-test-new-session';
  const existingSessionName = 'login-test-existing-session';
  const newSessionPath = getSessionPath(newSessionName);
  const existingSessionPath = getSessionPath(existingSessionName);

  after(() => {
    for (const path of [newSessionPath, existingSessionPath]) {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    }
  });

  test('creates a new session when user selects create new', async () => {
    if (fs.existsSync(newSessionPath)) {
      fs.unlinkSync(newSessionPath);
    }

    await saveSessionFromContext(createMockContext() as any, {
      pickChoice: async () => '__new__',
      promptName: async () => newSessionName,
      confirm: async () => true,
    });

    assert.ok(fs.existsSync(newSessionPath));
    assert.strictEqual(fs.readFileSync(newSessionPath, 'utf8'), '{"cookies":[],"origins":[]}');
  });

  test('overwrites an existing session when user confirms', async () => {
    fs.mkdirSync(getSessionsDir(), { recursive: true });
    fs.writeFileSync(existingSessionPath, '{"cookies":[],"origins":[]}');

    await saveSessionFromContext(createMockContext() as any, {
      pickChoice: async () => existingSessionName,
      promptName: async () => existingSessionName,
      confirm: async () => true,
    });

    assert.ok(fs.existsSync(existingSessionPath));
  });

  test('cancels when user declines overwrite', async () => {
    fs.mkdirSync(getSessionsDir(), { recursive: true });
    fs.writeFileSync(existingSessionPath, '{"cookies":[],"origins":[]}');

    await assert.rejects(
      () => saveSessionFromContext(createMockContext() as any, {
        pickChoice: async () => existingSessionName,
        promptName: async () => existingSessionName,
        confirm: async () => false,
      }),
      OperationCancelledError,
    );
  });

  test('supports piped stdin input for non-interactive use', () => {
    if (fs.existsSync(newSessionPath)) {
      fs.unlinkSync(newSessionPath);
    }

    const result = runSaveSessionFromContext(`1\n${newSessionName}\n`);
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.trim().endsWith('saved'));
    assert.ok(fs.existsSync(newSessionPath));
  });

  test('supports overwrite via piped stdin input', async () => {
    fs.mkdirSync(getSessionsDir(), { recursive: true });
    fs.writeFileSync(existingSessionPath, '{"cookies":[],"origins":[]}');

    const selection = await getSessionSelectionInput(existingSessionName);
    const result = runSaveSessionFromContext(`${selection}y\n`);
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.trim().endsWith('saved'));
  });
});
