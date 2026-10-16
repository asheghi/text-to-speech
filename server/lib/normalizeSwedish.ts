// Swedish text normalisation run before synthesis: expands numbers, currency,
// percentages and common abbreviations into words so every model reads them
// naturally instead of spelling digits or skipping symbols.

const ONES = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio',
    'tio', 'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton'];
const TENS = ['', '', 'tjugo', 'trettio', 'fyrtio', 'femtio', 'sextio', 'sjuttio', 'åttio', 'nittio'];

function below1000(n: number): string {
    let out = '';
    if (n >= 100) {
        out += ONES[Math.floor(n / 100)] + 'hundra';
        n %= 100;
    }
    if (n >= 20) {
        out += TENS[Math.floor(n / 10)];
        n %= 10;
        if (n) out += ONES[n];
    } else if (n || !out) {
        out += ONES[n];
    }
    return out;
}

export function numberToSwedish(n: number): string {
    if (!Number.isFinite(n) || n < 0 || n >= 1e12) return String(n);
    if (n < 1000) return below1000(n);
    const parts: string[] = [];
    const billions = Math.floor(n / 1e9);
    const millions = Math.floor((n % 1e9) / 1e6);
    const thousands = Math.floor((n % 1e6) / 1000);
    const rest = n % 1000;
    if (billions) parts.push(`${billions === 1 ? 'en' : below1000(billions)} ${billions === 1 ? 'miljard' : 'miljarder'}`);
    if (millions) parts.push(`${millions === 1 ? 'en' : below1000(millions)} ${millions === 1 ? 'miljon' : 'miljoner'}`);
    let tail = '';
    if (thousands) tail += (thousands === 1 ? 'et' : below1000(thousands)) + 'tusen';
    if (rest) tail += below1000(rest);
    if (tail) parts.push(tail);
    return parts.join(' ');
}

/** Years 1100–1999 are read "nittonhundra…" rather than "ettusen niohundra…". */
function yearToSwedish(n: number): string {
    if (n >= 1100 && n < 2000) {
        const rest = n % 100;
        return below1000(Math.floor(n / 100)) + 'hundra' + (rest ? below1000(rest) : '');
    }
    return numberToSwedish(n);
}

const ABBREVIATIONS: Array<[RegExp, string]> = [
    [/\bt\.\s?ex\./gi, 'till exempel'],
    [/\bbl\.\s?a\./gi, 'bland annat'],
    [/\bosv\./gi, 'och så vidare'],
    [/\bdvs\./gi, 'det vill säga'],
    [/\bd\.\s?v\.\s?s\./gi, 'det vill säga'],
    [/\bfr\.\s?o\.\s?m\./gi, 'från och med'],
    [/\bt\.\s?o\.\s?m\./gi, 'till och med'],
    [/\bca\b\.?/gi, 'cirka'],
    [/\bp\.\s?g\.\s?a\./gi, 'på grund av'],
    [/\bmfl\.|\bm\.\s?fl\./gi, 'med flera'],
    [/\bobs\b\.?/gi, 'observera'],
    [/\bnr\b\.?/gi, 'nummer'],
];

const toInt = (s: string) => parseInt(s.replace(/[\s ]/g, ''), 10);

function readNumber(raw: string): string {
    // Swedish decimal comma: "3,5" -> "tre komma fem"
    const [intPart, frac] = raw.split(',');
    let out = numberToSwedish(toInt(intPart));
    if (frac) out += ' komma ' + (frac.length <= 2 && !frac.startsWith('0')
        ? numberToSwedish(parseInt(frac, 10))
        : [...frac].map(d => ONES[+d]).join(' '));
    return out;
}

// Integer with optional space-grouped thousands ("10 000") and decimal comma.
const NUM = String.raw`\d{1,3}(?:[\s ]\d{3})+(?:,\d+)?|\d+(?:,\d+)?`;

export function normalizeSwedish(text: string): string {
    let t = text;
    for (const [re, rep] of ABBREVIATIONS) t = t.replace(re, rep);

    t = t.replace(new RegExp(`(${NUM})\\s?%`, 'g'), (_, n) => `${readNumber(n)} procent`);
    t = t.replace(new RegExp(`(${NUM})\\s?(?:kr|SEK)\\b\\.?`, 'g'), (_, n) => `${readNumber(n)} kronor`);
    t = t.replace(new RegExp(`(${NUM})\\s?(km|kg|cm|mm|m|g)\\b`, 'g'), (_, n, u: string) =>
        `${readNumber(n)} ${({ km: 'kilometer', kg: 'kilo', cm: 'centimeter', mm: 'millimeter', m: 'meter', g: 'gram' } as Record<string, string>)[u]}`);
    // Times (colon only, so "3.50" is not misread): 14:30 -> fjorton och trettio
    t = t.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_, h, m) =>
        `${numberToSwedish(+h)}${+m ? ' och ' + numberToSwedish(+m) : ''}`);
    // Day-of-month ordinals: "den 3" -> "den tredje" is ambiguous; keep cardinal.
    t = t.replace(/\b(1[1-9]\d{2})\b/g, (_, y) => yearToSwedish(+y));
    t = t.replace(new RegExp(`(^|[^\\w,])(${NUM})(?![\\w])`, 'g'), (_, pre, n) => pre + readNumber(n));
    return t;
}
