const cache = new Map<string, boolean>();
let count = 0;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchUntilFirstByte(url: string, retryCount = 0) {
    if (cache.get(url)) return;

    while (count > 8) {
        await new Promise(r => setTimeout(r, 500))
    }

    try {
        count++;
        const response = await fetch(url, { method: 'GET' });
        if (response.ok) {
            console.log(`[fetchUntilFirstByte] URL is reachable. Status: ${response.status}`);
            console.log(`[fetchUntilFirstByte] Content-Type: ${response.headers.get('Content-Type')}`);
            cache.set(url, true);
        } else {
            console.log(`[fetchUntilFirstByte] URL is not reachable. Status: ${response.status}`);
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
    }finally{
        count--;
    }
}