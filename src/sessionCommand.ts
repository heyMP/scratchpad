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
  promptForSessionName,
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
        devtools: !!opts['devtools'],
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
  .description('Delete a saved browser session.')
  .argument('[name]', 'session name to delete (shows a picker when omitted)')
  .option('--force', 'delete without confirmation')
  .action(async (name, options) => {
    try {
      const sessionName = name ?? await pickSession();

      const error = validateSessionName(sessionName);
      if (error) {
        throw new Error(error);
      }

      const sessionPath = getSessionPath(sessionName);
      if (!(await exists(sessionPath))) {
        throw new Error(`Session "${sessionName}" not found.`);
      }

      if (!options.force) {
        const confirmed = await confirmAction(`Delete session "${sessionName}"?`);
        if (!confirmed) {
          console.log('Delete cancelled.');
          return;
        }
      }

      await unlink(sessionPath);
      console.log(`Deleted session "${sessionName}".`);
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
