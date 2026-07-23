import { describe, expect, test } from 'bun:test';
import { SUPERTONIC_EXPRESSION_TAGS } from '#/lib/supertonicVoices';
import { insertExpressionTag } from './insertExpressionTag';

describe('Supertonic expression tags', () => {
    test('exposes all ten supported tags', () => {
        expect(SUPERTONIC_EXPRESSION_TAGS.map(({ tag }) => tag)).toEqual([
            '<laugh>',
            '<breath>',
            '<surprise>',
            '<sigh>',
            '<scream>',
            '<throatclear>',
            '<sad>',
            '<angry>',
            '<cough>',
            '<yawn>',
        ]);
    });

    test('inserts a tag at the caret with readable spacing', () => {
        expect(insertExpressionTag('Hello world', '<laugh>', 6, 6)).toEqual({
            text: 'Hello <laugh> world',
            caret: 14,
        });
    });

    test('replaces selected text and leaves the caret after the tag', () => {
        expect(insertExpressionTag('Say something now', '<sigh>', 4, 13)).toEqual({
            text: 'Say <sigh> now',
            caret: 10,
        });
    });

    test('leaves trailing space when inserting into empty text', () => {
        expect(insertExpressionTag('', '<breath>', 0, 0)).toEqual({
            text: '<breath> ',
            caret: 9,
        });
    });
});
