/** Sort Supertonic models first so they become the default pick for a language. */
export function preferSupertonic<T extends { family?: string | null }>(models: T[]): T[] {
    return [...models].sort((a, b) => Number(b.family === 'supertonic') - Number(a.family === 'supertonic'));
}
