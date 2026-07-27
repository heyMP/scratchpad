import { Command } from '@commander-js/extra-typings';
import { rename, unlink } from 'node:fs/promises';
import { login } from './login.js';
import { getConfig } from './config.js';
import {
  ensureSessionsDir,
  exists,
  getSessionPath,
  listSessions,
  validateSessionName,
} from './utils.js';

const loginSubcommand = new Command('login')
  .description('Launch a browser and save the session under a name when you close it.')
  .option('--name <name>', 'session name (skips the interactive prompt)')
  .action(async (options) => {
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
  .argument('<name>', 'session name to delete')
  .action(async (name) => {
    const error = validateSessionName(name);
    if (error) {
      throw new Error(error);
    }

    const sessionPath = getSessionPath(name);
    if (!(await exists(sessionPath))) {
      throw new Error(`Session "${name}" not found.`);
    }

    await unlink(sessionPath);
    console.log(`Deleted session "${name}".`);
  });

const renameSubcommand = new Command('rename')
  .description('Rename a saved browser session.')
  .argument('<oldName>', 'current session name')
  .argument('<newName>', 'new session name')
  .action(async (oldName, newName) => {
    const oldError = validateSessionName(oldName);
    if (oldError) {
      throw new Error(oldError);
    }

    const newError = validateSessionName(newName);
    if (newError) {
      throw new Error(newError);
    }

    const oldPath = getSessionPath(oldName);
    const newPath = getSessionPath(newName);

    if (!(await exists(oldPath))) {
      throw new Error(`Session "${oldName}" not found.`);
    }

    if (await exists(newPath)) {
      throw new Error(`Session "${newName}" already exists.`);
    }

    await ensureSessionsDir();
    await rename(oldPath, newPath);
    console.log(`Renamed session "${oldName}" to "${newName}".`);
  });

export const sessionCommand = new Command('session')
  .description('Manage saved browser sessions.')
  .addCommand(loginSubcommand)
  .addCommand(listSubcommand)
  .addCommand(deleteSubcommand)
  .addCommand(renameSubcommand);
