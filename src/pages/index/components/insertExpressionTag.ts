export function insertExpressionTag(
    text: string,
    tag: string,
    selectionStart: number,
    selectionEnd: number,
): { text: string; caret: number } {
    const start = Math.max(0, Math.min(selectionStart, text.length));
    const end = Math.max(start, Math.min(selectionEnd, text.length));
    const needsLeadingSpace = start > 0 && !/\s/.test(text[start - 1]);
    const needsTrailingSpace = end === text.length || !/\s/.test(text[end]);
    const insertion = `${needsLeadingSpace ? ' ' : ''}${tag}${needsTrailingSpace ? ' ' : ''}`;

    return {
        text: text.slice(0, start) + insertion + text.slice(end),
        caret: start + insertion.length,
    };
}
