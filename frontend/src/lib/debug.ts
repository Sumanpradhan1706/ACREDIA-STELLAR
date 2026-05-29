export function isDebugLoggingEnabled(): boolean {
    return (
        process.env.NODE_ENV !== 'production' &&
        process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true'
    );
}

export function debugLog(...args: unknown[]) {
    if (isDebugLoggingEnabled()) {
        console.log(...args);
    }
}

export function debugWarn(...args: unknown[]) {
    if (isDebugLoggingEnabled()) {
        console.warn(...args);
    }
}
