// Respelling lexicon for Supertonic Swedish. Supertonic reads raw characters
// (no phonemizer), so it applies the regular Swedish spelling rules — soft k/g
// before front vowels, spelled-out loanwords — even where a word breaks them.
// Each entry rewrites a stem into a spelling Supertonic pronounces correctly.
// Every entry was verified by synthesising both spellings and transcribing
// them with KBLab/kb-whisper-medium (see plans/swedish-tts-quality.md).
// Do not apply to Piper/VITS: espeak-ng phonemizes those correctly already.

// [stem, replacement, suffix pattern]. The stem matches at a word start and
// the suffix covers inflections, so "ingenjörerna" is handled by "ingenjör".
const ENTRIES: Array<[string, string, string]> = [
    // Hard k before a front vowel (exceptions to the soft-k rule)
    ['kille', 'kkille', '(n|ns|ar|arna|arnas)?'],
    ['killar', 'kkillar', '(na|nas)?'],
    ['kebab', 'kkebab', '(en|ens|er|erna|s)?'],
    ['kiwi', 'kkiwi', '(n|ns|s|er|erna)?'],
    ['kex', 'kkex', '(et|ets|en|ens|s)?'],
    // French/English loanwords with a sj-sound
    ['ingenjör', 'insjenjör', '(en|ens|er|erna|ernas|s)?'],
    ['journalist', 'sjurnalist', '(en|ens|er|erna|ernas|isk|iska|s)?'],
    ['genre', 'sjangre', '(n|ns|r|rna|s)?'],
    ['gest', 'sjest', '(en|er|erna|s)?'],
    ['lasagne', 'lasanje', '(n|ns|s)?'],
];

const COMPILED = ENTRIES.map(([stem, rep, suffix]) => ({
    re: new RegExp(`(?<![\\p{L}])${stem}(${suffix})(?![\\p{L}])`, 'giu'),
    rep,
}));

function matchCase(original: string, replacement: string): string {
    if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase();
    if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
    return replacement;
}

export function respellSwedishForSupertonic(text: string): string {
    let t = text;
    for (const { re, rep } of COMPILED) {
        t = t.replace(re, (m: string, suffix: string) => matchCase(m, rep + suffix.toLowerCase()));
    }
    return t;
}
