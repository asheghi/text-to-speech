import { describe, expect, test } from 'bun:test';
import { splitToSentences } from './splitToSentences';

const trimmed = (t: string) => splitToSentences(t).map(s => s.trim());

describe('splitToSentences', () => {
    test('splits on sentence-ending punctuation followed by a space', () => {
        expect(trimmed('Hej. Hur mår du? Bra!')).toEqual(['Hej.', 'Hur mår du?', 'Bra!']);
    });
    test('keeps Swedish abbreviations inside the sentence', () => {
        expect(trimmed('Vi åt t.ex. glass och bl.a. kakor. Sedan gick vi.')).toEqual(['Vi åt t.ex. glass och bl.a. kakor.', 'Sedan gick vi.']);
    });
    test('does not split on colon or semicolon in short sentences', () => {
        expect(trimmed('Han sa: kom hit; nu.')).toEqual(['Han sa: kom hit; nu.']);
    });
    test('does not split inside numbers or domains', () => {
        expect(trimmed('Besök www.svt.se idag.')).toEqual(['Besök www.svt.se idag.']);
    });
    test('keeps sentences made only of Swedish letters', () => {
        expect(trimmed('Å. Ö!')).toEqual(['Å.', 'Ö!']);
    });
    test('splits long sentences at ; then commas, under 180 chars', () => {
        const long = Array.from({ length: 12 }, (_, i) => `del nummer ${i} av en lång mening`).join(', ') + '.';
        const parts = trimmed(long);
        expect(parts.length).toBeGreaterThan(1);
        for (const p of parts) expect(p.length).toBeLessThanOrEqual(180);
        expect(parts.join(' ')).toBe(long);
    });
    test('long quoted spans become their own piece', () => {
        expect(trimmed('Han sa "det här är ett långt citat" och gick.')).toEqual(['Han sa', '"det här är ett långt citat"', 'och gick.']);
    });
});
