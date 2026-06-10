import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildLaunchOptions } from './browser.js';

describe('buildLaunchOptions', () => {
  test('returns empty args when no options set', () => {
    const result = buildLaunchOptions({});
    assert.deepStrictEqual(result.args, []);
    assert.strictEqual(result.headless, undefined);
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

  test('devtools adds --auto-open-devtools-for-tabs and forces headless false', () => {
    const result = buildLaunchOptions({ devtools: true, headless: true });
    assert.ok(result.args!.includes('--auto-open-devtools-for-tabs'));
    assert.strictEqual(result.headless, false);
  });

  test('devtools false does not add --auto-open-devtools-for-tabs', () => {
    const result = buildLaunchOptions({ devtools: false });
    assert.ok(!result.args!.includes('--auto-open-devtools-for-tabs'));
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
