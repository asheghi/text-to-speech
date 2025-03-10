import { useLocalStorageState } from '@/lib/useLocalStorageState';

export function useSource() {
    const [text, setText] = useLocalStorageState('text', 'You can type here...');
    const [model, setModel] = useLocalStorageState<string>('model','');
    const [language, setLanguage] = useLocalStorageState<string>('language', '')
    const [speed, setSpeed] = useLocalStorageState('speed', 1);

    const changeSpeed = (arg: number) => {
        setSpeed(arg);
    }

    const changeModel = (arg: string) => {
        console.log("change model called", arg)
        setModel(arg)
    }
    const changeLanguage = (arg: string) => {
        console.log("change langauge called", arg)
        setLanguage(arg);
    }
    const changeText = (arg: string) => {
        setText(arg);
    }

    return {
        text,
        model,
        speed,
        changeSpeed,
        changeModel,
        changeLanguage,
        language,
        changeText,
    }
}