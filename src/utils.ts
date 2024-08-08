import { stat } from 'node:fs/promises';

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
