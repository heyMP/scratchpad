import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { Processor } from './Processor.js';
import { getSessionPath } from './utils.js';

describe('Processor Session', () => {
  const sessionName = 'test-session';
  const sessionPath = getSessionPath(sessionName);

  before(() => {
    fs.mkdirSync(join(os.homedir(), '.scratchpad', 'sessions'), { recursive: true });
    fs.writeFileSync(sessionPath, '{}');
  });

  after(() => {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
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
