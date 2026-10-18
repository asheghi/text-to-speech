import { describe, expect, test } from 'bun:test';
import { normalizeSwedish as n, ordinalToSwedish } from './normalizeSwedish';

describe('normalizeSwedish', () => {
    test('numbers, currency, percent', () => {
        expect(n('Det kostar 249 kr.')).toBe('Det kostar tvåhundrafyrtionio kronor.');
        expect(n('3,5 % mer')).toBe('tre komma fem procent mer');
        expect(n('10 000 personer')).toBe('tiotusen personer');
    });
    test('years and times', () => {
        expect(n('År 1998')).toBe('År nittonhundranittioåtta');
        expect(n('kl. 14:30')).toBe('klockan fjorton och trettio');
    });
    test('dates and ordinals', () => {
        expect(n('den 3 maj 2024')).toBe('den tredje maj tvåtusentjugofyra');
        expect(n('2024-05-03')).toBe('tredje maj tvåtusentjugofyra');
        expect(n('på 3:e plats och 21:a')).toBe('på tredje plats och tjugoförsta');
        expect(ordinalToSwedish(30)).toBe('trettionde');
    });
    test('abbreviations', () => {
        expect(n('t.ex. kakor, bl.a. bullar')).toBe('till exempel kakor, bland annat bullar');
    });
});

describe('number one agrees with the noun', () => {
    test('en and ett', () => {
        expect(n('Jag har 1 bok och 1 barn.')).toBe('Jag har en bok och ett barn.');
        expect(n('1 person, 1 skolbarn, 1 bageri, 1 museum')).toBe('en person, ett skolbarn, ett bageri, ett museum');
        expect(n('1 år')).toBe('ett år');
    });
    test('bare numbers stay ett', () => {
        expect(n('1 till 3')).toBe('ett till tre');
        expect(n('Siffran 1.')).toBe('Siffran ett.');
    });
    test('units and currency', () => {
        expect(n('1 kr')).toBe('en krona');
        expect(n('1 km och 1 kg')).toBe('en kilometer och ett kilo');
        expect(n('1 %')).toBe('en procent');
    });
});
