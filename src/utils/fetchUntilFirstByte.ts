/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchUntilFirstByte(url: string, retryCount = 0) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            console.log(`[fetchUntilFirstByte] URL is reachable. Status: ${response.status}`);
            console.log(`[fetchUntilFirstByte] Content-Type: ${response.headers.get('Content-Type')}`);
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
        throw error;
    }
}