import qs from 'qs';
import { DEFAULT_STEPS, DEFAULT_VOICE_STYLE } from '#/lib/supertonicVoices';

export const getTtsLink = (
    text: string,
    model: string,
    speed: number,
    steps: number = DEFAULT_STEPS,
    voiceStyle: string = DEFAULT_VOICE_STYLE,
) => {
    const query = qs.stringify({ text, model, speed, steps, voiceStyle });
    return "/api/tts.wav?" + query;
}
