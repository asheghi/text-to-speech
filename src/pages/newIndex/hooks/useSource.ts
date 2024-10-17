import { useState } from 'react';
import {  useSearchParams } from 'react-router-dom';

export function useSource() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [text,setText] = useState(localStorage.getItem('text') ?? "Type something here")
    const [model,setModel] = useState(searchParams.get("model") ?? undefined);
    const [language,setLanguage] = useState(searchParams.get("language") ?? undefined)
    const speedParam = searchParams.get("speed") ?? "1";
    const [speed,setSpeed] = useState(parseFloat(speedParam));



    const updateParam = (key: string, value: unknown) => {
        searchParams.set(key, String(value));
        setSearchParams(searchParams);
    }

    const changeSpeed = (arg: number) => {
        console.log("change speed called",arg)
        updateParam('speed',arg);
        setSpeed(arg);
    }

    const changeModel = (arg: string) => {
        console.log("change model called",arg)
        updateParam('model',arg);
        setModel(arg)
    }
    const changeLanguage = (arg: string) => {
        console.log("change langauge called",arg)
        updateParam('language',arg)
        setLanguage(arg);
    }
    const changeText = (arg: string) => {
        localStorage.setItem('text',arg);
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