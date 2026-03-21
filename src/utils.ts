import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import os from 'node:os';

/**
 * Formats the session path, ensuring it has a .json extension
 */
export const formatSessionPath = (path?: string) => {
  let resolvedPath = path || join(os.homedir(), '.scratchpad', 'login.json');
  
  if (resolvedPath === '~') {
    resolvedPath = os.homedir();
  } else if (resolvedPath.startsWith('~/') || resolvedPath.startsWith('~\\')) {
    resolvedPath = join(os.homedir(), resolvedPath.slice(2));
  }

  return resolvedPath.endsWith('.json') ? resolvedPath : `${resolvedPath}.json`;
};

/**
 * Helper function to check if a file exists
 */
export const exists = (path: string) => stat(path).then(() => true, () => false);

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
