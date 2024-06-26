/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, FormEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "../../../api"
import { languageList } from "./consts/languageList";
import Dropdown from "./Dropdown";
import { Link } from "react-router-dom";

interface IFormProps {
    onSubmit: (params: { model: string, text: string }) => void;
    isPending: boolean;
}

export const Form = (props: IFormProps): JSX.Element => {
    const modelsQuery = trpc.tts.getModelsList.useQuery();
    const [selectedLanguage, setSelectedLanguage] = useState<{ value: string | undefined | null, lable: string }>(() => {
        try {
            const json = localStorage.getItem("language");
            if (!json) return undefined;
            return JSON.parse(json);
        } catch (error) {
            console.error(error);
            return undefined;
        }
    });
    const [selectedModel, setSelectedModel] = useState<{ value: string | undefined | null, lable: string }>(() => {
        try {
            const json = localStorage.getItem("model");
            if (!json) return undefined;
            return JSON.parse(json);
        } catch (error) {
            console.error(error);
            return undefined;
        }
    });

    const [text, setText] = useState<string>(() => {
        try {
            const json = localStorage.getItem("text");
            if (!json) return undefined;
            return JSON.parse(json);
        } catch (error) {
            console.error(error);
            return undefined;
        }
    });
    const getModelsForLanguage = useCallback((lanaugeCode: string | undefined | null) => (modelsQuery.data ?? []).filter(model => {
        return model.modelName.toLowerCase().includes(`-${lanaugeCode}-`) || model.modelName.toLowerCase().includes(`-${lanaugeCode}_`);
    }), [modelsQuery.data]);

    const filteredModels = useMemo(() => {
        if (!modelsQuery.data) return []
        if (!selectedLanguage || !selectedLanguage?.value?.length) return modelsQuery.data ?? [];
        return getModelsForLanguage(selectedLanguage.value);
    }, [modelsQuery.data, selectedLanguage, getModelsForLanguage]);

    const filteredLanguages = useMemo(() => {
        if (!modelsQuery.data) return languageList;
        return languageList.filter((language) => {
            const list = getModelsForLanguage(language.code) ?? []
            return list.length > 0;
        });
    }, [modelsQuery.data, getModelsForLanguage]);


    useEffect(() => {
        localStorage.setItem("model", JSON.stringify(selectedModel));
        localStorage.setItem("language", JSON.stringify(selectedLanguage));
        localStorage.setItem("text", JSON.stringify(text));
    }, [selectedLanguage, selectedModel, text])

    if (modelsQuery.isPending) {
        return <p>Loading...</p>
    }

    if (modelsQuery.isError) {
        return <p>Error</p>
    }

    const handleLanguageSelect = function (newValue: any): void {
        setSelectedLanguage(newValue);
        const it = getModelsForLanguage(newValue?.value)[0];
        if (!it) return;
        setSelectedModel({ value: it.modelName, lable: it.modelName });
    };

    const handleFormSubmit: FormEventHandler<HTMLFormElement> = (event: FormEvent): void => {
        event.preventDefault();

        if (!selectedModel.value || !text) {
            return;
        }

        if (props.isPending) return;

        props.onSubmit({
            model: selectedModel.value,
            text: text.trim(),
        })
    }

    function handleTextChange(event: { target: { value: string } }): void {
        setText(event.target.value);
    }

    return <form onSubmit={handleFormSubmit} className="container mx-auto">
        <div className="flex py-2 gap-2 items-center">
            <label className="font-bold min-w-[120px]">Language</label>
            <Dropdown
                isDisabled={props.isPending}
                options={filteredLanguages.map(it => ({ value: it.code, lable: `${it.name} (${it.nativeName})` }))}
                value={selectedLanguage}
                onChange={handleLanguageSelect}
                placeholder="Select a language"
            />
        </div>
        <div className="flex gap-2 items-center py-2">
            <label className="font-bold min-w-[120px]">Model</label>
            <Dropdown
                isDisabled={props.isPending}
                options={filteredModels.map(it => ({ value: it.modelName, lable: it.modelName }))}
                value={selectedModel}
                placeholder="Select a voice"
                onChange={function (newValue: any): void {
                    setSelectedModel(newValue)
                }} />
        </div>
        <div className="flex gap-2 item-center py-2">
            <label className="font-bold min-w-[120px]">Text</label>
            <textarea
                disabled={props.isPending}
                value={text}
                onChange={handleTextChange}
                placeholder="Enter text to synthesize"
                className="w-full h-32 p-2 border rounded-md border-gray-300 min-h-[240px] outline-blue-500"
            />
        </div>
        <div className="flex">
            <Link
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md ml-[128px] text-xl font-semibold"
                to={"/reader"}
            >Read ️📖</Link>
            <button
                disabled={props.isPending}
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md ml-[128px] text-xl font-semibold">Synthesize ▶️</button>
        </div>
    </form>
}