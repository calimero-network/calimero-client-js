import type { ErrorObject } from 'ajv';

export function formatAjvErrors(errors: ErrorObject[] = []): string {
  return errors
    .map((e) => {
      const path = e.instancePath || '/';
      const msg = e.message ?? 'validation error';
      const where = path.replace(/\//g, '.').replace(/^\./, '');
      return `• ${where || '<root>'}: ${msg}`;
    })
    .join('\n');
}
