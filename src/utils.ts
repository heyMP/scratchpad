import { stat, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import os from 'node:os';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const SESSION_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export type SessionInfo = {
  name: string;
  savedAt: Date;
};

/**
 * Helper function to check if a file exists
 */
export const exists = (path: string) => stat(path).then(() => true, () => false);

export function getSessionsDir() {
  return join(os.homedir(), '.scratchpad', 'sessions');
}

export async function ensureSessionsDir() {
  await mkdir(getSessionsDir(), { recursive: true });
}

export function validateSessionName(name: string): string | undefined {
  if (!name || !SESSION_NAME_PATTERN.test(name)) {
    return 'Session name must contain only letters, numbers, hyphens, and underscores.';
  }
  return undefined;
}

export function getSessionPath(name: string) {
  const error = validateSessionName(name);
  if (error) {
    throw new Error(error);
  }
  return join(getSessionsDir(), `${name}.json`);
}

export async function listSessions(): Promise<SessionInfo[]> {
  const sessionsDir = getSessionsDir();
  if (!(await exists(sessionsDir))) {
    return [];
  }

  const entries = await readdir(sessionsDir);
  const sessions: SessionInfo[] = [];

  for (const entry of entries) {
    if (!entry.endsWith('.json')) {
      continue;
    }
    const filePath = join(sessionsDir, entry);
    const stats = await stat(filePath);
    sessions.push({
      name: entry.replace(/\.json$/, ''),
      savedAt: stats.mtime,
    });
  }

  return sessions.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
}

export async function generateDefaultSessionName() {
  const date = new Date();
  const base = `session-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const sessions = await listSessions();
  const names = new Set(sessions.map((session) => session.name));

  if (!names.has(base)) {
    return base;
  }

  let counter = 2;
  while (names.has(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

export async function promptForSessionName(defaultName: string) {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    while (true) {
      const answer = await rl.question(`Session name [${defaultName}]: `);
      const name = answer.trim() || defaultName;
      const error = validateSessionName(name);
      if (error) {
        console.error(error);
        continue;
      }
      return name;
    }
  } finally {
    rl.close();
  }
}

export async function pickSession() {
  const sessions = await listSessions();
  if (sessions.length === 0) {
    throw new Error('No saved sessions found. Run `scratchpad session login` to create one.');
  }

  console.log('\nAvailable sessions:');
  sessions.forEach((session, index) => {
    const saved = session.savedAt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    console.log(`  ${index + 1}. ${session.name} (saved ${saved})`);
  });
  console.log('');

  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    while (true) {
      const answer = await rl.question(`Select a session [1-${sessions.length}]: `);
      const selection = Number.parseInt(answer.trim(), 10);
      if (Number.isNaN(selection) || selection < 1 || selection > sessions.length) {
        console.error(`Please enter a number between 1 and ${sessions.length}.`);
        continue;
      }
      return sessions[selection - 1].name;
    }
  } finally {
    rl.close();
  }
}

/**
 * Template Literal function that converts an string
 * containing ESM javascript to data URI.
 *
 * @example
 * const m1 = esm`export function f() { return 'Hello!' }`;
 * const m2 = esm`import {f} from '${m1}'; export default f()+f();`;
 * import(m1)
 */
export function esm(templateStrings: TemplateStringsArray, ...substitutions: any[]): string {
  let js = templateStrings.raw[0];
  for (let i = 0; i < substitutions.length; i++) {
    js += substitutions[i] + templateStrings.raw[i + 1];
  }
  return 'data:text/javascript;base64,' + btoa(js);
}
