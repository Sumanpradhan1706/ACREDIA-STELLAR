import { getRuntimeConfig } from './runtimeConfig';

export function isDebugLoggingEnabled(): boolean {
    return process.env.NODE_ENV !== 'production' && getRuntimeConfig().debug.enableLogs;
}

export function debugLog(...args: unknown[]) {
    if (isDebugLoggingEnabled()) {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
}

export function debugWarn(...args: unknown[]) {
    if (isDebugLoggingEnabled()) {
        console.warn(...args);
    }
}
