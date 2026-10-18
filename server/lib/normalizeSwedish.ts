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

const ORD_SMALL = ['nollte', 'första', 'andra', 'tredje', 'fjärde', 'femte', 'sjätte', 'sjunde', 'åttonde', 'nionde',
    'tionde', 'elfte', 'tolfte', 'trettonde', 'fjortonde', 'femtonde', 'sextonde', 'sjuttonde', 'artonde', 'nittonde'];

/** 3 -> "tredje", 21 -> "tjugoförsta", 30 -> "trettionde". */
export function ordinalToSwedish(n: number): string {
    if (n < 20) return ORD_SMALL[n];
    if (n < 100) return n % 10 ? TENS[Math.floor(n / 10)] + ORD_SMALL[n % 10] : TENS[n / 10] + 'nde';
    return numberToSwedish(n) + 'de';
}

const MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti',
    'september', 'oktober', 'november', 'december'];

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
    // "kl 14" / "kl. 14": only before a digit, so the word "kl" elsewhere is untouched.
    [/\bkl\.?(?=\s*\d)/gi, 'klockan'],
];

// Common "ett" nouns (neuter). "1" before any other word is read "en", which is
// right for about 3 of 4 Swedish nouns. Compounds are matched on their last part
// (skolbarn -> barn), so only base words are needed here.
const ETT_NOUNS = new Set(`år barn hus land ord jobb språk bord rum fönster tåg flyg flygplan
    kort brev glas äpple ägg bröd kilo gram ark exempel fel problem system program
    företag land liv namn nummer par paket pris prov rop samtal sätt ställe svar
    tal tak träd tecken test uttryck val var verk villkor ögonblick öra öga ben
    hjärta huvud ansikte finger djur får lamm svin bi hem hotell kontor kök
    sjukhus museum centrum bibliotek konto lån beslut förslag avtal möte
    projekt mål moment ögonblick dygn decennium sekel kvarter kapitel stycke
    papper foto kök fat kärl lag lager mönster ljud ljus moln regn vatten salt
    socker kaffe te vin öl kött barnbarn dokument instrument parti spel lopp
    besök ärende intresse universitet gymnasium fält torg slott berg hav`.split(/\s+/));
const ETT_SUFFIXES = ['eri', 'ment', 'um', 'ande', 'ende'];
// After these, "1" is a bare number ("1 till 3", "1 av 5"), read "ett".
const NOT_NOUNS = new Set('till och eller av i på per à från mot än som om eller plus minus gånger delat'.split(' '));

/** "en" or "ett" for the number 1 before this word. */
function oneFor(word: string): string {
    const w = word.toLowerCase();
    if (NOT_NOUNS.has(w) || ETT_NOUNS.has(w) || ETT_SUFFIXES.some(s => w.endsWith(s))) return 'ett';
    // Compounds take the gender of their last part: skolbarn -> barn. Only parts
    // of 3+ letters, so short words like "te" do not match unrelated endings.
    for (let i = 1; i <= w.length - 3; i++) if (ETT_NOUNS.has(w.slice(i))) return 'ett';
    return 'en';
}

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

    // ISO dates: 2024-05-03 -> "tredje maj tvåtusentjugofyra"
    t = t.replace(/\b(\d{4})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b/g, (_, y, m, d) =>
        `${ordinalToSwedish(+d)} ${MONTHS[+m - 1]} ${yearToSwedish(+y)}`);
    // Day before a month name is an ordinal: "3 maj" -> "tredje maj"
    t = t.replace(new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])\\.?\\s+(${MONTHS.join('|')})\\b`, 'gi'), (_, d, m) =>
        `${ordinalToSwedish(+d)} ${m}`);
    // Written ordinals: 3:e, 1:a, 2:a, 21:a -> tredje, första, andra, tjugoförsta
    t = t.replace(/\b(\d{1,3}):([ae])\b/g, (_, n) => ordinalToSwedish(+n));

    t = t.replace(new RegExp(`(${NUM})\\s?%`, 'g'), (_, n) => `${n === '1' ? 'en' : readNumber(n)} procent`);
    t = t.replace(new RegExp(`(${NUM})\\s?(?:kr|SEK)\\b`, 'g'), (_, n) => n === '1' ? 'en krona' : `${readNumber(n)} kronor`);
    t = t.replace(new RegExp(`(${NUM})\\s?(km|kg|cm|mm|m|g)\\b`, 'g'), (_, n, u: string) =>
        `${n === '1' ? (u === 'kg' || u === 'g' ? 'ett' : 'en') : readNumber(n)} ${({ km: 'kilometer', kg: 'kilo', cm: 'centimeter', mm: 'millimeter', m: 'meter', g: 'gram' } as Record<string, string>)[u]}`);
    // Times (colon only, so "3.50" is not misread): 14:30 -> fjorton och trettio
    t = t.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_, h, m) =>
        `${numberToSwedish(+h)}${+m ? ' och ' + numberToSwedish(+m) : ''}`);
    t = t.replace(/\b(1[1-9]\d{2})\b/g, (_, y) => yearToSwedish(+y));
    // "1" before a word agrees with its gender: en bok, ett barn.
    t = t.replace(/(^|[^\p{L}\p{N},])1\s+(\p{Ll}+)/gu, (_, pre, w) => `${pre}${oneFor(w)} ${w}`);
    t = t.replace(new RegExp(`(^|[^\\w,])(${NUM})(?![\\w])`, 'g'), (_, pre, n) => pre + readNumber(n));
    return t;
}
