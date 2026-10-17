import { SentenceType } from "./types/SentenceType";

// Pieces longer than this are split further at ; : and then commas, so each
// request stays under the public 200-character cap (PUBLIC_MAX_TEXT_LENGTH).
const MAX_PIECE = 180;

// Abbreviations whose trailing period does not end a sentence. Splitting
// there would also stop the server from expanding them (normalizeSwedish).
const ABBREVIATION = /(?:^|[\s(])(?:t\.\s?ex|bl\.\s?a|d\.\s?v\.\s?s|dvs|fr\.\s?o\.\s?m|t\.\s?o\.\s?m|p\.\s?g\.\s?a|m\.\s?fl|ca|nr|e\.\s?g|i\.\s?e|e\.g|i\.e|mr|mrs|dr|st)\.$/i;

const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
// Outside a "quoted span" (an even number of quotes follow).
const OUTSIDE_QUOTES = '(?=(?:[^"]*"[^"]*")*[^"]*$)';

function splitSentenceEnds(line: string): string[] {
    const parts: string[] = [];
    let start = 0;
    const re = new RegExp(`[.?!]+(?=\\s|$)${OUTSIDE_QUOTES}`, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
        const end = m.index + m[0].length;
        if (m[0] === '.' && ABBREVIATION.test(line.slice(Math.max(0, m.index - 8), end))) continue;
        parts.push(line.slice(start, end));
        start = end;
    }
    parts.push(line.slice(start));
    return parts;
}

/** Split an over-long piece at ; or :, then at commas, keeping each part <= MAX_PIECE. */
function splitLong(piece: string): string[] {
    if (piece.length <= MAX_PIECE) return [piece];
    for (const sep of [/(?<=[;:])\s+/, /(?<=,)\s+/]) {
        const chunks = piece.split(sep);
        if (chunks.length < 2) continue;
        const out: string[] = [];
        let cur = '';
        for (const c of chunks) {
            if (cur && (cur + ' ' + c).length > MAX_PIECE) { out.push(cur); cur = c; }
            else cur = cur ? cur + ' ' + c : c;
        }
        if (cur) out.push(cur);
        if (out.length > 1) return out.flatMap(splitLong);
    }
    return [piece];
}

export function splitToSentences(text: string): SentenceType[] {
    return text
        .split('\n')
        .map(it => it + '\n')
        .flatMap(it => {
            if (it === '\n' || it === " \n") {
                return [it];
            }
            return it
                // Long quoted spans become their own pieces.
                .replace(/"([^"]+)"/g, (match, content) => {
                    if (content.length > 12) {
                        return `|"${content}"|`;
                    }
                    return match;
                })
                .replace(/" (\p{Lu})/gu, '"|$1')
                .split("|")
                .flatMap(splitSentenceEnds)
                .flatMap(splitLong);
        })
        .map((it, index, arr) => {
            // Glue punctuation-only fragments (closing quotes, newlines) onto the previous piece.
            let i = index + 1;
            let appending = "";
            while (i < arr.length - 1) {
                const current = arr[i];
                if (HAS_LETTER_OR_DIGIT.test(current.trim())) {
                    break;
                } else {
                    appending += current;
                }
                i++;
            }
            return it + appending;
        })
        .filter(it => HAS_LETTER_OR_DIGIT.test(it.trim()))
}
