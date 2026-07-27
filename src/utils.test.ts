import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import {
  generateDefaultSessionName,
  getSessionPath,
  getSessionsDir,
  listSessions,
  validateSessionName,
} from './utils.js';

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
});
