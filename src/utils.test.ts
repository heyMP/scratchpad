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
  listSessions,
  OperationCancelledError,
  validateSessionName,
} from './utils.js';

const testDir = dirname(fileURLToPath(import.meta.url));

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
  const testSessionPath = getSessionPath(testSessionName);

  before(() => {
    fs.mkdirSync(getSessionsDir(), { recursive: true });
    fs.writeFileSync(testSessionPath, '{}');
  });

  after(() => {
    if (fs.existsSync(testSessionPath)) {
      fs.unlinkSync(testSessionPath);
    }
  });

  test('validateSessionName rejects invalid names', () => {
    assert.strictEqual(validateSessionName(''), 'Session name must contain only letters, numbers, hyphens, and underscores.');
    assert.strictEqual(validateSessionName('../escape'), 'Session name must contain only letters, numbers, hyphens, and underscores.');
    assert.strictEqual(validateSessionName('valid-name_1'), undefined);
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
