/* eslint-disable no-console */

const enabled = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

export const logger = {
  warn: (...args: unknown[]) => {
    if (enabled) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (enabled) console.error(...args);
  },
  info: (...args: unknown[]) => {
    if (enabled) console.info(...args);
  },
};
