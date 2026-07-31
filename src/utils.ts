import { stat, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import net from 'node:net';
import os from 'node:os';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { cancel, confirm, isCancel, multiselect, select, text } from '@clack/prompts';

const SESSION_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const TRUE_BOOLEAN_VALUES = new Set(['true', '1', 'yes']);
const FALSE_BOOLEAN_VALUES = new Set(['false', '0', 'no']);

export function parseBooleanOption(value: boolean | string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUE_BOOLEAN_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_BOOLEAN_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: "${value}". Use true or false.`);
}

export class OperationCancelledError extends Error {
  constructor(message = 'Operation cancelled.') {
    super(message);
    this.name = 'OperationCancelledError';
  }
}

export type SessionInfo = {
  name: string;
  savedAt: Date;
};

export type SessionSelectOption = {
  value: string;
  label: string;
  hint: string;
};

function formatSessionSavedDate(savedAt: Date) {
  return savedAt.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSessionOptions(sessions: SessionInfo[]): SessionSelectOption[] {
  return sessions.map((session) => ({
    value: session.name,
    label: session.name,
    hint: `saved ${formatSessionSavedDate(session.savedAt)}`,
  }));
}

/**
 * Helper function to check if a file exists
 */
export const exists = (path: string) => stat(path).then(() => true, () => false);

export function getSessionsDir() {
  const customDir = process.env.SCRATCHPAD_SESSIONS_DIR;
  if (customDir) {
    return customDir;
  }
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

async function promptForSessionNameWithReadline(defaultName: string) {
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

export async function promptForSessionName(defaultName: string) {
  if (!stdin.isTTY) {
    return promptForSessionNameWithReadline(defaultName);
  }

  const name = await text({
    message: 'Session name',
    defaultValue: defaultName,
    validate: (value) => validateSessionName(value || defaultName),
  });

  if (isCancel(name)) {
    cancel('Operation cancelled.');
    throw new OperationCancelledError();
  }

  return name || defaultName;
}

async function confirmActionWithReadline(message: string) {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const answer = await rl.question(`${message} [y/N]: `);
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

export async function confirmAction(message: string) {
  if (!stdin.isTTY) {
    return confirmActionWithReadline(message);
  }

  const result = await confirm({ message });
  if (isCancel(result)) {
    return false;
  }

  return result;
}

async function pickSessionWithReadline(sessions: SessionInfo[]) {
  console.log('\nAvailable sessions:');
  sessions.forEach((session, index) => {
    const saved = formatSessionSavedDate(session.savedAt);
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

async function pickSessionWithClack(sessions: SessionInfo[]) {
  const choice = await select({
    message: 'Select a session',
    options: formatSessionOptions(sessions),
  });

  if (isCancel(choice)) {
    cancel('Session selection cancelled.');
    throw new OperationCancelledError();
  }

  return choice;
}

export async function pickSession() {
  const sessions = await listSessions();
  if (sessions.length === 0) {
    throw new Error('No saved sessions found. Run `scratchpad session login` to create one.');
  }

  if (stdin.isTTY) {
    return pickSessionWithClack(sessions);
  }

  return pickSessionWithReadline(sessions);
}

async function pickSessionsWithReadline(sessions: SessionInfo[]) {
  console.log('\nAvailable sessions:');
  sessions.forEach((session, index) => {
    const saved = formatSessionSavedDate(session.savedAt);
    console.log(`  ${index + 1}. ${session.name} (saved ${saved})`);
  });
  console.log('');

  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    while (true) {
      const answer = await rl.question(`Select sessions to delete (comma-separated numbers, e.g. 1,3): `);
      const selections = answer
        .split(',')
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((selection) => !Number.isNaN(selection));

      if (selections.length === 0) {
        console.error('Please enter at least one session number.');
        continue;
      }

      const invalid = selections.filter((selection) => selection < 1 || selection > sessions.length);
      if (invalid.length > 0) {
        console.error(`Please enter numbers between 1 and ${sessions.length}.`);
        continue;
      }

      const uniqueSelections = [...new Set(selections)];
      return uniqueSelections.map((selection) => sessions[selection - 1].name);
    }
  } finally {
    rl.close();
  }
}

async function pickSessionsWithClack(sessions: SessionInfo[]) {
  const choices = await multiselect({
    message: 'Select sessions to delete',
    options: formatSessionOptions(sessions),
    required: true,
  });

  if (isCancel(choices)) {
    cancel('Session selection cancelled.');
    throw new OperationCancelledError();
  }

  return choices;
}

export async function pickSessions() {
  const sessions = await listSessions();
  if (sessions.length === 0) {
    throw new Error('No saved sessions found. Run `scratchpad session login` to create one.');
  }

  if (stdin.isTTY) {
    return pickSessionsWithClack(sessions);
  }

  return pickSessionsWithReadline(sessions);
}

const DEFAULT_DEBUG_PORT = 9222;

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

export async function findAvailableDebugPort(preferredPort?: number): Promise<number> {
  const start = preferredPort ?? DEFAULT_DEBUG_PORT;
  for (let port = start; port < start + 100; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available debug port found in range ${start}-${start + 99}`);
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
