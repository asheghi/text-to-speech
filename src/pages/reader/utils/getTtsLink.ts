import qs from 'qs';

export const getTtsLink = (text: string, model: string, speed: number) => {
    const query = qs.stringify({ text, model, speed })
    const url = "/api/tts.wav?" + query;
    return url;
}