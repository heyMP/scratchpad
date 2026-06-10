import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildLaunchOptions } from './browser.js';

describe('buildLaunchOptions', () => {
  test('returns empty args when no options set', () => {
    const result = buildLaunchOptions({});
    assert.deepStrictEqual(result.args, []);
    assert.strictEqual(result.headless, undefined);
    assert.strictEqual(result.devtools, undefined);
  });

  test('respects launchOptions.headless when top-level headless is not set', () => {
    const result = buildLaunchOptions({
      launchOptions: { headless: true },
    });
    assert.strictEqual(result.headless, true);
  });

  test('respects top-level headless when launchOptions.headless is not set', () => {
    const result = buildLaunchOptions({ headless: true });
    assert.strictEqual(result.headless, true);
  });

  test('top-level headless wins over launchOptions.headless', () => {
    const result = buildLaunchOptions({
      headless: false,
      launchOptions: { headless: true },
    });
    assert.strictEqual(result.headless, false);
  });

  test('respects launchOptions.devtools when top-level devtools is not set', () => {
    const result = buildLaunchOptions({
      launchOptions: { devtools: true },
    });
    assert.strictEqual(result.devtools, true);
  });

  test('respects top-level devtools when launchOptions.devtools is not set', () => {
    const result = buildLaunchOptions({ devtools: true });
    assert.strictEqual(result.devtools, true);
  });

  test('top-level devtools wins over launchOptions.devtools', () => {
    const result = buildLaunchOptions({
      devtools: false,
      launchOptions: { devtools: true },
    });
    assert.strictEqual(result.devtools, false);
  });

  test('bypassCSP adds --disable-web-security to args', () => {
    const result = buildLaunchOptions({ bypassCSP: true });
    assert.deepStrictEqual(result.args, ['--disable-web-security']);
  });

  test('launchOptions.args are preserved when no bypassCSP', () => {
    const result = buildLaunchOptions({
      launchOptions: { args: ['--remote-debugging-port=9222'] },
    });
    assert.deepStrictEqual(result.args, ['--remote-debugging-port=9222']);
  });

  test('bypassCSP and launchOptions.args are concatenated', () => {
    const result = buildLaunchOptions({
      bypassCSP: true,
      launchOptions: {
        args: ['--remote-debugging-port=9222', '--remote-allow-origins=*'],
      },
    });
    assert.deepStrictEqual(result.args, [
      '--disable-web-security',
      '--remote-debugging-port=9222',
      '--remote-allow-origins=*',
    ]);
  });

  test('non-overlapping launchOptions fields are passed through', () => {
    const result = buildLaunchOptions({
      launchOptions: { slowMo: 100, channel: 'chrome' },
    });
    assert.strictEqual(result.slowMo, 100);
    assert.strictEqual(result.channel, 'chrome');
  });
});
