import { describe, expect, test } from 'bun:test';
import { respellSwedishForSupertonic as r } from './swedishRespell';

describe('respellSwedishForSupertonic', () => {
    test('patterns: stj -> sj, vowel+gn -> ngn', () => {
        expect(r('Stjärnorna och regnet')).toBe('Sjärnorna och rengnet');
        expect(r('vagn, lugn, ugn')).toBe('vangn, lungn, ungn');
        expect(r('gnaga')).toBe('gnaga'); // word-initial gn untouched
    });
    test('stem entries keep inflections and case', () => {
        expect(r('Ingenjörerna och killen')).toBe('Insjenjörerna och kkillen');
        expect(r('KILLAR')).toBe('KKILLAR');
        expect(r('korgen med yoghurt')).toBe('korjen med jogurt');
    });
    test('stems only match whole words', () => {
        expect(r('gestalt')).toBe('gestalt');
        expect(r('sorg')).toBe('sorg');
    });
    test('auto entries', () => {
        expect(r('en månkalender')).toBe('en mån-kalender');
    });
});
