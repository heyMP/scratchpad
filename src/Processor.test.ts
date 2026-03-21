import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { join } from 'node:path';
import { Processor } from './Processor.js';

describe('Processor Session Path', () => {
  const customSessionPath = 'custom-test-login.json';
  const customSessionPathAbsolute = join(process.cwd(), customSessionPath);

  before(() => {
    // Create a dummy session file for success cases
    fs.writeFileSync(customSessionPathAbsolute, '{}');
  });

  after(() => {
    // Clean up
    if (fs.existsSync(customSessionPathAbsolute)) {
      fs.unlinkSync(customSessionPathAbsolute);
    }
  });

  test('throws error when custom session file is not found', () => {
    assert.throws(
      () => {
        new Processor({ login: true, sessionPath: 'non-existent-file.json' });
      },
      /Session file not found\./
    );
  });

  test('does not throw when custom session file exists', () => {
    assert.doesNotThrow(() => {
      // By not passing a file prop, it avoids throwing the subsequent 'file not found' error
      new Processor({ login: true, sessionPath: customSessionPath });
    });
  });

  test('adds .json to session path if missing', () => {
    assert.doesNotThrow(() => {
      // The before() creates custom-test-login.json
      // Here we pass it without the .json extension, it should resolve to custom-test-login.json and not throw
      new Processor({ login: true, sessionPath: 'custom-test-login' });
    });
  });

  test('resolves ~ to homedir', () => {
    assert.throws(
      () => {
        new Processor({ login: true, sessionPath: '~/some-non-existent-test-file.json' });
      },
      /Session file not found\./
    );
  });
});
