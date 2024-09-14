import qs from 'qs';

export const getTtsLink = (text: string, model: string) => {
    const query = qs.stringify({ text, model })
    const url = "/api/tts.wav?" + query;
    return url;
}