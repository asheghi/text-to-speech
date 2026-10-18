// Respelling lexicon for Supertonic Swedish. Supertonic reads raw characters
// (no phonemizer), so it applies the regular Swedish spelling rules — soft k/g
// before front vowels, spelled-out loanwords — even where a word breaks them.
// Each entry rewrites a stem into a spelling Supertonic pronounces correctly.
// Every entry was verified by synthesising both spellings and transcribing
// them with KBLab/kb-whisper-medium (see docs/swedish-tts-quality.md).
// Do not apply to Piper/VITS: espeak-ng phonemizes those correctly already.

// Exact-word entries found by the automated TTS -> STT loop
// (docs/swedish-tts-quality.md). Keys are lowercase words.
import AUTO from './swedishRespell.auto.json';

// [stem, replacement, suffix pattern]. The stem matches at a word start and
// the suffix covers inflections, so "ingenjörerna" is handled by "ingenjör".
const ENTRIES: Array<[string, string, string]> = [
    // Hard k before a front vowel (exceptions to the soft-k rule)
    ['kille', 'kkille', '(n|ns|ar|arna|arnas)?'],
    ['killar', 'kkillar', '(na|nas)?'],
    ['kebab', 'kkebab', '(en|ens|er|erna|s)?'],
    ['kiwi', 'kkiwi', '(n|ns|s|er|erna)?'],
    ['kex', 'kkex', '(et|ets|en|ens|s)?'],
    // Final rg is a j-sound in these words (korj, färj, torj). Not a general rule:
    // respelling sorg or talg made them worse (4-voice check, tools/sv-loop/ruletest.py).
    ['korg', 'korj', '(en|ens|ar|arna|arnas|s)?'],
    // Every word starting with färg is about colour, so it covers verbs and
    // compounds too (färgat 1->4, färgade 2->4, färgblindhet 3->4).
    ['färg', 'färj', '\\p{L}*'],
    ['torg', 'torj', '(et|ets|en|s)?'],
    // Loanword spellings Supertonic misreads (4-voice check: yoghurt 1->4, eksem 0->4)
    ['yoghurt', 'jogurt', '(en|ens|ar|arna|s)?'],
    ['eksem', 'exem', '(et|ets|en|s)?'],
    // Compounds read as one syllable run; mark the boundary (förser 1->4,
    // färskjäst 0->4). Not general: torr-jäst and jäs-korgar only reached 1-2/4.
    ['förser', 'för-ser', ''],
    ['färskjäst', 'färsk-jäst', '(en|ens)?'],
    // French/English loanwords with a sj-sound
    ['ingenjör', 'insjenjör', '(en|ens|er|erna|ernas|s)?'],
    ['journalist', 'sjurnalist', '(en|ens|er|erna|ernas|isk|iska|s)?'],
    ['genre', 'sjangre', '(n|ns|r|rna|s)?'],
    ['gest', 'sjest', '(en|er|erna|s)?'],
    ['lasagne', 'lasanje', '(n|ns|s)?'],
];

// Spelling-to-sound patterns Supertonic gets wrong across whole word families.
// Verified on 4 voices (F1/M1/F3/M3) with the KB-Whisper loop.
const PATTERNS: Array<[RegExp, string]> = [
    // "stj" is a sj-sound (stjärna, stjäla, stjälk); Supertonic pronounces the t.
    [/stj/giu, 'sj'],
    // Vowel + "gn" is pronounced "ngn" (regn, vagn, lugn, ugn, lögn).
    [/(?<=[aeiouyåäö])gn/giu, 'ngn'],
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
    for (const [re, rep] of PATTERNS) {
        t = t.replace(re, m => matchCase(m, rep));
    }
    const auto = AUTO as Record<string, string>;
    return t.replace(/\p{L}+/gu, w => {
        const rep = auto[w.toLowerCase()];
        return rep ? matchCase(w, rep) : w;
    });
}
