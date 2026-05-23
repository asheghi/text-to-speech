import { useLocalStorageState } from '@/lib/useLocalStorageState';
import { DEFAULT_STEPS, DEFAULT_VOICE_STYLE } from '#/lib/supertonicVoices';

export function useSource() {
    const [text, setText] = useLocalStorageState('text', 'You can type here...');
    const [model, setModel] = useLocalStorageState<string>('model','');
    const [language, setLanguage] = useLocalStorageState<string>('language', '')
    const [speed, setSpeed] = useLocalStorageState('speed', 1);
    const [steps, setSteps] = useLocalStorageState('steps', DEFAULT_STEPS);
    const [voiceStyle, setVoiceStyle] = useLocalStorageState<string>('voiceStyle', DEFAULT_VOICE_STYLE);

    const changeSpeed = (arg: number) => setSpeed(arg);
    const changeModel = (arg: string) => { console.log("change model called", arg); setModel(arg); }
    const changeLanguage = (arg: string) => { console.log("change language called", arg); setLanguage(arg); }
    const changeText = (arg: string) => setText(arg);
    const changeSteps = (arg: number) => setSteps(arg);
    const changeVoiceStyle = (arg: string) => setVoiceStyle(arg);

    return {
        text, model, speed, language,
        steps, voiceStyle,
        changeSpeed, changeModel, changeLanguage, changeText,
        changeSteps, changeVoiceStyle,
    }
}
