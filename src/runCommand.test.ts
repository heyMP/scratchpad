import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Command } from '@commander-js/extra-typings';
import { resolveDebug } from './runCommand.js';

describe('resolveDebug', () => {
  test('returns config debug when no CLI flags are set', () => {
    assert.strictEqual(resolveDebug(undefined, undefined, true), true);
    assert.strictEqual(resolveDebug(undefined, undefined, 9333), 9333);
    assert.strictEqual(resolveDebug(undefined, undefined, undefined), undefined);
  });

  test('--debug enables debugging', () => {
    assert.strictEqual(resolveDebug(true, undefined, undefined), true);
  });

  test('--debug-port sets a specific port', () => {
    assert.strictEqual(resolveDebug(undefined, '9333', undefined), 9333);
  });

  test('--debug-port overrides --debug and config', () => {
    assert.strictEqual(resolveDebug(true, '9333', true), 9333);
  });

  test('--debug overrides config', () => {
    assert.strictEqual(resolveDebug(true, undefined, 9222), true);
  });

  test('throws for invalid debug port', () => {
    assert.throws(
      () => resolveDebug(undefined, 'not-a-port', undefined),
      /Invalid debug port: not-a-port/,
    );
  });
});

describe('run command debug flags', () => {
  function parseRunArgs(args: string[]) {
    let captured: { file?: string; debug?: boolean | number } = {};

    const cmd = new Command('run')
      .argument('[file]')
      .option('--debug', 'enable remote debugging')
      .option('--debug-port <port>', 'remote debugging port')
      .action((file, options) => {
        captured = {
          file,
          debug: resolveDebug(options.debug, options.debugPort, undefined),
        };
      });

    cmd.parse(['node', 'run', ...args]);
    return captured;
  }

  test('--debug does not consume the file argument', () => {
    assert.deepStrictEqual(parseRunArgs(['--debug', './my-test-file.js']), {
      file: './my-test-file.js',
      debug: true,
    });
  });

  test('--debug-port does not consume the file argument', () => {
    assert.deepStrictEqual(parseRunArgs(['--debug-port', '9333', './my-test-file.js']), {
      file: './my-test-file.js',
      debug: 9333,
    });
  });
});
