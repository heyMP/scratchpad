import { Command } from '@commander-js/extra-typings';
import { rename, unlink } from 'node:fs/promises';
import { login } from './login.js';
import { getConfig } from './config.js';
import {
  confirmAction,
  ensureSessionsDir,
  exists,
  generateDefaultSessionName,
  getSessionPath,
  listSessions,
  OperationCancelledError,
  pickSession,
  pickSessions,
  promptForSessionName,
  parseBooleanOption,
  validateSessionName,
} from './utils.js';

const loginSubcommand = new Command('login')
  .description('Launch a browser and save the session under a name when you close it.')
  .option('--name <name>', 'session name (skips the interactive prompt)')
  .action(async (options) => {
    try {
      const config = await getConfig();
      const opts = { ...config, ...options };

      if (typeof opts['name'] === 'string') {
        const error = validateSessionName(opts['name']);
        if (error) {
          throw new Error(error);
        }
      }

      await login({
        ...(opts['devtools'] !== undefined && { devtools: parseBooleanOption(opts['devtools']) }),
        url: typeof opts['url'] === 'string' ? opts['url'] : undefined,
        sessionName: typeof opts['name'] === 'string' ? opts['name'] : undefined,
      });
    } catch (error) {
      if (error instanceof OperationCancelledError) {
        console.log('Login cancelled.');
        return;
      }
      throw error;
    }
  });

const listSubcommand = new Command('list')
  .description('List saved browser sessions.')
  .action(async () => {
    const sessions = await listSessions();

    if (sessions.length === 0) {
      console.log('No saved sessions found.');
      return;
    }

    for (const session of sessions) {
      const saved = session.savedAt.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      console.log(`${session.name} (saved ${saved})`);
    }
  });

const deleteSubcommand = new Command('delete')
  .description('Delete saved browser sessions.')
  .argument('[names...]', 'session names to delete (shows a checkbox picker when omitted)')
  .option('--force', 'delete without confirmation')
  .action(async (names, options) => {
    try {
      const sessionNames = names.length > 0 ? names : await pickSessions();

      for (const sessionName of sessionNames) {
        const error = validateSessionName(sessionName);
        if (error) {
          throw new Error(error);
        }

        const sessionPath = getSessionPath(sessionName);
        if (!(await exists(sessionPath))) {
          throw new Error(`Session "${sessionName}" not found.`);
        }
      }

      if (!options.force) {
        const message = sessionNames.length === 1
          ? `Delete session "${sessionNames[0]}"?`
          : `Delete ${sessionNames.length} sessions (${sessionNames.join(', ')})?`;
        const confirmed = await confirmAction(message);
        if (!confirmed) {
          console.log('Delete cancelled.');
          return;
        }
      }

      for (const sessionName of sessionNames) {
        await unlink(getSessionPath(sessionName));
      }

      if (sessionNames.length === 1) {
        console.log(`Deleted session "${sessionNames[0]}".`);
      } else {
        console.log(`Deleted ${sessionNames.length} sessions: ${sessionNames.join(', ')}.`);
      }
    } catch (error) {
      if (error instanceof OperationCancelledError) {
        console.log('Delete cancelled.');
        return;
      }
      throw error;
    }
  });

const renameSubcommand = new Command('rename')
  .description('Rename a saved browser session.')
  .argument('[oldName]', 'current session name (shows a picker when omitted)')
  .argument('[newName]', 'new session name (prompts when omitted)')
  .action(async (oldName, newName) => {
    try {
      const currentName = oldName ?? await pickSession();
      const nextName = newName ?? await promptForSessionName(await generateDefaultSessionName());

      const oldError = validateSessionName(currentName);
      if (oldError) {
        throw new Error(oldError);
      }

      const newError = validateSessionName(nextName);
      if (newError) {
        throw new Error(newError);
      }

      const oldPath = getSessionPath(currentName);
      const newPath = getSessionPath(nextName);

      if (!(await exists(oldPath))) {
        throw new Error(`Session "${currentName}" not found.`);
      }

      if (await exists(newPath)) {
        throw new Error(`Session "${nextName}" already exists.`);
      }

      await ensureSessionsDir();
      await rename(oldPath, newPath);
      console.log(`Renamed session "${currentName}" to "${nextName}".`);
    } catch (error) {
      if (error instanceof OperationCancelledError) {
        console.log('Rename cancelled.');
        return;
      }
      throw error;
    }
  });

export const sessionCommand = new Command('session')
  .description('Manage saved browser sessions.')
  .addCommand(loginSubcommand)
  .addCommand(listSubcommand)
  .addCommand(deleteSubcommand)
  .addCommand(renameSubcommand);
