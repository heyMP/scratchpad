import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatSessionOptions,
  generateDefaultSessionName,
  getSessionPath,
  getSessionsDir,
  isPortAvailable,
  findAvailableDebugPort,
  getCdpWebSocketUrl,
  listSessions,
  OperationCancelledError,
  parseBooleanOption,
  validateSessionName,
} from './utils.js';
import { cleanupTestSessionsDir, createTestSessionsDir } from './testHelpers.js';

const testDir = dirname(fileURLToPath(import.meta.url));
let sessionsDir: string;

function runConfirmAction(input: string) {
  const script = `
    import { confirmAction } from './utils.js';
    const result = await confirmAction('Delete session?');
    process.stdout.write(result ? 'true' : 'false');
  `;
  return spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: testDir,
    input,
    encoding: 'utf8',
  });
}

describe('Session utilities', () => {
  const testSessionName = 'utils-test-session';
  let testSessionPath: string;

  before(() => {
    sessionsDir = createTestSessionsDir();
    testSessionPath = getSessionPath(testSessionName);
    fs.mkdirSync(getSessionsDir(), { recursive: true });
    fs.writeFileSync(testSessionPath, '{}');
  });

  after(() => {
    cleanupTestSessionsDir(sessionsDir);
  });

  test('validateSessionName rejects invalid names', () => {
    assert.strictEqual(validateSessionName(''), 'Session name must contain only letters, numbers, hyphens, and underscores.');
    assert.strictEqual(validateSessionName('../escape'), 'Session name must contain only letters, numbers, hyphens, and underscores.');
    assert.strictEqual(validateSessionName('valid-name_1'), undefined);
  });

  test('parseBooleanOption parses CLI boolean strings', () => {
    assert.strictEqual(parseBooleanOption(true), true);
    assert.strictEqual(parseBooleanOption(false), false);
    assert.strictEqual(parseBooleanOption('true'), true);
    assert.strictEqual(parseBooleanOption('false'), false);
    assert.strictEqual(parseBooleanOption('0'), false);
    assert.strictEqual(parseBooleanOption('1'), true);
    assert.throws(() => parseBooleanOption('maybe'), /Invalid boolean value/);
  });

  test('listSessions includes saved sessions', async () => {
    const sessions = await listSessions();
    assert.ok(sessions.some((session) => session.name === testSessionName));
  });

  test('generateDefaultSessionName uses date format', async () => {
    const name = await generateDefaultSessionName();
    assert.match(name, /^session-\d{4}-\d{2}-\d{2}(-\d+)?$/);
  });

  test('formatSessionOptions maps sessions to select options', () => {
    const savedAt = new Date('2026-07-27T12:00:00Z');
    const options = formatSessionOptions([
      { name: 'work', savedAt },
      { name: 'personal', savedAt },
    ]);

    assert.deepStrictEqual(options, [
      {
        value: 'work',
        label: 'work',
        hint: `saved ${savedAt.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}`,
      },
      {
        value: 'personal',
        label: 'personal',
        hint: `saved ${savedAt.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}`,
      },
    ]);
  });
});

describe('OperationCancelledError', () => {
  test('uses the expected name and default message', () => {
    const error = new OperationCancelledError();
    assert.strictEqual(error.name, 'OperationCancelledError');
    assert.strictEqual(error.message, 'Operation cancelled.');
  });

  test('accepts a custom message', () => {
    const error = new OperationCancelledError('Rename cancelled.');
    assert.strictEqual(error.message, 'Rename cancelled.');
  });
});

describe('confirmAction', () => {
  test('returns true when user confirms', () => {
    const result = runConfirmAction('y\n');
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.trim().endsWith('true'));
  });

  test('returns false when user declines', () => {
    const result = runConfirmAction('n\n');
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.trim().endsWith('false'));
  });

  test('returns false for empty input', () => {
    const result = runConfirmAction('\n');
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.trim().endsWith('false'));
  });
});

describe('debug port utilities', () => {
  test('isPortAvailable returns true for an unused port', async () => {
    const available = await isPortAvailable(19876);
    assert.strictEqual(available, true);
  });

  test('isPortAvailable returns false for a port in use', async () => {
    const net = await import('node:net');
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(19877, '127.0.0.1', resolve));
    try {
      const available = await isPortAvailable(19877);
      assert.strictEqual(available, false);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test('findAvailableDebugPort returns the preferred port when free', async () => {
    const port = await findAvailableDebugPort(19878);
    assert.strictEqual(port, 19878);
  });

  test('findAvailableDebugPort skips occupied ports', async () => {
    const net = await import('node:net');
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(19879, '127.0.0.1', resolve));
    try {
      const port = await findAvailableDebugPort(19879);
      assert.ok(port > 19879);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe('getCdpWebSocketUrl', () => {
  test('returns webSocketDebuggerUrl from /json/version', async () => {
    const http = await import('node:http');
    const wsUrl = 'ws://127.0.0.1:19880/devtools/browser/test';
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ webSocketDebuggerUrl: wsUrl }));
    });
    await new Promise<void>((resolve) => server.listen(19880, '127.0.0.1', resolve));
    try {
      assert.strictEqual(await getCdpWebSocketUrl(19880, 1), wsUrl);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  test('returns undefined when CDP endpoint is unavailable', async () => {
    assert.strictEqual(await getCdpWebSocketUrl(19881, 1, 1), undefined);
  });
});
