import playwright from 'playwright';
import type { BrowserContext } from 'playwright';
import util from 'node:util';
import { readFile } from 'node:fs/promises';
import { stdin } from 'node:process';
import { cancel, isCancel, select } from '@clack/prompts';
import type { Config } from './config.js';
import {
  confirmAction,
  ensureSessionsDir,
  exists,
  formatSessionOptions,
  generateDefaultSessionName,
  getSessionPath,
  listSessions,
  OperationCancelledError,
  promptForSessionName,
  validateSessionName,
  type SessionInfo,
} from './utils.js';
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.depth = null;

export async function login(config: Config) {
  await ensureSessionsDir();

  const sessionName = config.sessionName
    ?? await promptForSessionName(await generateDefaultSessionName());
  const sessionPath = getSessionPath(sessionName);

  if (await exists(sessionPath)) {
    const confirmed = await confirmAction(`Session "${sessionName}" already exists. Overwrite?`);
    if (!confirmed) {
      throw new OperationCancelledError();
    }
  }

  const browser = await playwright['chromium'].launch({
    headless: false,
    args: config.devtools ? ['--auto-open-devtools-for-tabs'] : [],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  if (config.url) {
    await page.goto(config.url);
  }

  page.on('close', async () => {
    await context.storageState({ path: sessionPath });
    await browser.close();
    console.log(`\x1b[33m 👻 Session saved as "${sessionName}"\x1b[0m`);
  });
}

export async function getSession(name: string) {
  const filePath = getSessionPath(name);
  const sessionFile = await readFile(filePath, 'utf8');
  if (!sessionFile) {
    return undefined;
  }
  try {
    return JSON.parse(sessionFile);
  } catch {
    throw new Error(`Session "${name}" is invalid or corrupted.`);
  }
}

const CREATE_NEW_SESSION = '__new__';

type SaveSessionPrompts = {
  pickChoice: (sessions: SessionInfo[]) => Promise<string | symbol>;
  promptName: (defaultName: string) => Promise<string>;
  confirm: (message: string) => Promise<boolean>;
};

async function readAllInputLines() {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks)
    .toString('utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function printSessionSaveOptions(sessions: SessionInfo[]) {
  console.log('\nSave session:');
  console.log('  1. Create new session');
  sessions.forEach((session, index) => {
    const saved = session.savedAt.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    console.log(`  ${index + 2}. ${session.name} (saved ${saved})`);
  });
  console.log('');
}

function createReadlinePromptsFromLines(lines: string[]): SaveSessionPrompts {
  let lineIndex = 0;
  const nextLine = () => {
    const line = lines[lineIndex++];
    if (line === undefined) {
      throw new OperationCancelledError();
    }
    return line;
  };

  return {
    async pickChoice(sessions) {
      printSessionSaveOptions(sessions);

      while (true) {
        const max = sessions.length + 1;
        const selection = Number.parseInt(nextLine(), 10);
        if (selection === 1) {
          return CREATE_NEW_SESSION;
        }
        if (selection >= 2 && selection <= max) {
          return sessions[selection - 2].name;
        }
        console.error(`Please enter a number between 1 and ${max}.`);
      }
    },
    async promptName(defaultName) {
      while (true) {
        const name = nextLine() || defaultName;
        const error = validateSessionName(name);
        if (error) {
          console.error(error);
          continue;
        }
        return name;
      }
    },
    async confirm(_message) {
      return nextLine().toLowerCase() === 'y';
    },
  };
}

function createClackPrompts(): SaveSessionPrompts {
  return {
    async pickChoice(sessions) {
      return select({
        message: 'Save session',
        options: [
          { value: CREATE_NEW_SESSION, label: 'Create new session' },
          ...formatSessionOptions(sessions),
        ],
      });
    },
    promptName: (defaultName) => promptForSessionName(defaultName),
    confirm: (message) => confirmAction(message),
  };
}

async function saveSessionFromContextWithPrompts(
  context: BrowserContext,
  prompts: SaveSessionPrompts,
) {
  await ensureSessionsDir();
  const sessions = await listSessions();
  const choice = await prompts.pickChoice(sessions);

  if (isCancel(choice)) {
    cancel('Session save cancelled.');
    throw new OperationCancelledError();
  }

  let sessionName: string;
  if (choice === CREATE_NEW_SESSION) {
    sessionName = await prompts.promptName(await generateDefaultSessionName());
    if (await exists(getSessionPath(sessionName))) {
      const confirmed = await prompts.confirm(`Session "${sessionName}" already exists. Overwrite?`);
      if (!confirmed) {
        throw new OperationCancelledError();
      }
    }
  } else {
    const confirmed = await prompts.confirm(`Overwrite session "${choice}"?`);
    if (!confirmed) {
      throw new OperationCancelledError();
    }
    sessionName = choice;
  }

  const sessionPath = getSessionPath(sessionName);
  await context.storageState({ path: sessionPath });
  console.log(`\x1b[33m 👻 Session saved as "${sessionName}"\x1b[0m`);
}

export async function saveSessionFromContext(
  context: BrowserContext,
  prompts?: SaveSessionPrompts,
) {
  if (prompts) {
    return saveSessionFromContextWithPrompts(context, prompts);
  }

  if (!stdin.isTTY) {
    const lines = await readAllInputLines();
    return saveSessionFromContextWithPrompts(context, createReadlinePromptsFromLines(lines));
  }

  return saveSessionFromContextWithPrompts(context, createClackPrompts());
}
