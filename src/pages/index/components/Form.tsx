/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, FormEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "../../../api"
import { languageList } from "./consts/languageList";
import Dropdown from "./Dropdown";
import GenerateIcon from '@mui/icons-material/SpatialAudioOff'
import LoadingIcon from '@mui/icons-material/RecordVoiceOver';
import IconSpeaker from '@mui/icons-material/RecordVoiceOverOutlined'
import IconLanguage from '@mui/icons-material/LanguageOutlined'
import IconText from '@mui/icons-material/ArticleOutlined'

import "./Form.scss"
import { FormType } from "../FormType";
import { Button, FormControl, FormHelperText, FormLabel, Textarea } from "@mui/joy";

interface IFormProps {
    onFormChange: (params: FormType) => void;
    isPending: boolean;
    onSubmit: () => void;
    player: React.ReactNode;
}

const getLocalStorageItem = (key: string) => () => {
    try {
        const json = localStorage.getItem(key);
        if (!json) return undefined;
        return JSON.parse(json);
    } catch (error) {
        console.error(error);
        return undefined;
    }
};


export const Form = (props: IFormProps): JSX.Element => {
    const modelsQuery = trpc.tts.getModelsList.useQuery();

    const [selectedLanguage, setSelectedLanguage] = useState<{ value: string | undefined | null, lable: string }>(getLocalStorageItem('language'));
    const [selectedModel, setSelectedModel] = useState<{ value: string | undefined | null, lable: string }>(getLocalStorageItem('model'));
    const [text, setText] = useState<string>(getLocalStorageItem('text'));

    useEffect(() => {
        props.onFormChange({
            model: selectedModel?.value ?? "",
            text: text?.trim(),
            language: selectedLanguage?.value ?? "",
        });
    }, [props, selectedLanguage?.value, selectedModel?.value, text])

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

        props.onSubmit()
    }

    function handleTextChange(event: { target: { value: string } }): void {
        setText(event.target.value);
    }

    return <form onSubmit={handleFormSubmit} className="form">
        <div className="flex flex-col gap-4 md:flex-row">
            <FormControl className="flex-1">
                <FormLabel>
                    <IconLanguage />
                    Language
                </FormLabel>
                <Dropdown
                    isDisabled={props.isPending}
                    options={filteredLanguages.map(it => ({ value: it.code, lable: `${it.name} (${it.nativeName})` }))}
                    value={selectedLanguage}
                    onChange={handleLanguageSelect}
                    placeholder="Select a language"
                />
            </FormControl>
            <FormControl className="flex-1">
                <FormLabel >
                    <IconSpeaker />
                    Speaker
                </FormLabel>
                <Dropdown
                    isDisabled={props.isPending}
                    options={filteredModels.map(it => ({ value: it.modelName, lable: it.modelName }))}
                    value={selectedModel}
                    placeholder="Select a voice"
                    onChange={function (newValue: any): void {
                        setSelectedModel(newValue)
                    }} />
            </FormControl>
        </div>
        <FormControl>
            <FormLabel>
                <IconText />
                Text
            </FormLabel>
            <Textarea
                disabled={props.isPending}
                value={text}
                onChange={handleTextChange}
                placeholder="Enter text to synthesize"
                className="w-full"
                maxRows={12}
                minRows={6}
            />
            <FormHelperText>text can be very long</FormHelperText>
        </FormControl>
        {props.player}
        <Button
            disabled={props.isPending}
            loading={props.isPending}
            type="submit"
            className="gap-2 self-end"
        >
            {props.isPending ? <LoadingIcon /> : <GenerateIcon />}
            {props.isPending ? 'Generating' : 'Synthesize'}
        </Button>

    </form>
}