import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { Processor } from './Processor.js';
import { getSessionPath, getSessionsDir } from './utils.js';
import { cleanupTestSessionsDir, createTestSessionsDir } from './testHelpers.js';

describe('Processor Session', () => {
  const sessionName = 'test-session';
  let sessionsDir: string;
  let sessionPath: string;

  before(() => {
    sessionsDir = createTestSessionsDir();
    sessionPath = getSessionPath(sessionName);
    fs.mkdirSync(getSessionsDir(), { recursive: true });
    fs.writeFileSync(sessionPath, '{}');
  });

  after(() => {
    cleanupTestSessionsDir(sessionsDir);
  });

  test('throws error when session is not found', () => {
    assert.throws(
      () => {
        new Processor({ session: 'non-existent-session' });
      },
      /Session "non-existent-session" not found\./
    );
  });

  test('does not throw when session exists', () => {
    assert.doesNotThrow(() => {
      new Processor({ session: sessionName });
    });
  });
});
