/**
 * Production-safe logging utility
 * Only logs in development environment to prevent console noise in production
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args: any[]) => {
    // Always show warnings as they indicate potential issues
    console.warn(...args);
  },
  
  error: (...args: any[]) => {
    // Always show errors as they indicate failures
    console.error(...args);
  }
};