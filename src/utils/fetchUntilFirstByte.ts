const cache = new Map<string, boolean>();
let count = 0;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchUntilFirstByte(url: string, retryCount = 0): Promise<{ cached: boolean }> {
    if (cache.get(url)) return { cached: true };

    while (count > 0) {
        await new Promise(r => setTimeout(r, 100))
    }

    try {
        count++;
        const response = await fetch(url, { method: 'GET' });
        if (response.ok) {
            cache.set(url, true);
            const serverCached = response.headers.get('X-Cache') === 'HIT';
            return { cached: serverCached };
        } else {
            console.log(`[fetchUntilFirstByte] URL is not reachable. Status: ${response.status}`);
            return { cached: false };
        }
    } catch (error: any) {
        console.log(`[fetchUntilFirstByte] Error fetching URL: ${error.message}`);
        if (retryCount < 3) {
            console.log(`[fetchUntilFirstByte] Retrying (${retryCount + 1}/3)...`);
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            return fetchUntilFirstByte(url, retryCount + 1);
        }
        cache.set(url, false);
        throw error;
    } finally {
        count--;
    }
}
