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
import IconRead from '@mui/icons-material/MenuBookOutlined'
import IconTune from '@mui/icons-material/TuneOutlined'

import "./Form.scss"
import { FormType } from "../FormType";
import {
    Button, FormControl, FormHelperText, FormLabel, Slider, Textarea, Select, Option,
} from "@mui/joy";
import {
    SUPERTONIC_VOICES,
    DEFAULT_STEPS, MIN_STEPS, MAX_STEPS, DEFAULT_VOICE_STYLE,
} from '#/lib/supertonicVoices';

interface IFormProps {
    onFormChange: (params: FormType) => void;
    isPending: boolean;
    isSharePending: boolean;
    onSubmit: () => void;
    onRead?: () => void;
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
    const [selectedSteps, setSelectedSteps] = useState<number>(getLocalStorageItem('steps') ?? DEFAULT_STEPS);
    const [selectedVoiceStyle, setSelectedVoiceStyle] = useState<string>(getLocalStorageItem('voiceStyle') ?? DEFAULT_VOICE_STYLE);

    // Detect if selected model is Supertonic
    const selectedModelData = useMemo(
        () => modelsQuery.data?.find(m => m.modelName === selectedModel?.value),
        [modelsQuery.data, selectedModel?.value],
    );
    const isSupertonic = selectedModelData?.family === 'supertonic';

    useEffect(() => {
        props.onFormChange({
            model: selectedModel?.value ?? "",
            text: text?.trim(),
            language: selectedLanguage?.value ?? "",
            steps: selectedSteps,
            voiceStyle: selectedVoiceStyle,
        });
    }, [props, selectedLanguage?.value, selectedModel?.value, text, selectedSteps, selectedVoiceStyle])

    const getModelsForLanguage = useCallback((languageCode: string | undefined | null) => (modelsQuery.data ?? []).filter(model => {
        return model.modelName.toLowerCase().includes(`-${languageCode}-`) || model.modelName.toLowerCase().includes(`-${languageCode}_`);
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
        localStorage.setItem("steps", JSON.stringify(selectedSteps));
        localStorage.setItem("voiceStyle", JSON.stringify(selectedVoiceStyle));
    }, [selectedLanguage, selectedModel, text, selectedSteps, selectedVoiceStyle])

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

    const stepsMarks = [2, 4, 6, 8, 10, 12, 14, 16].map(it => ({ value: it, label: it }));
    const maleVoices = SUPERTONIC_VOICES.filter(v => v.gender === 'Male');
    const femaleVoices = SUPERTONIC_VOICES.filter(v => v.gender === 'Female');

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
                    Model
                </FormLabel>
                <Dropdown
                    isDisabled={props.isPending}
                    options={filteredModels.map(it => ({ value: it.modelName, lable: it.modelName }))}
                    value={selectedModel}
                    placeholder="Select a model"
                    onChange={function (newValue: any): void {
                        setSelectedModel(newValue)
                    }} />
            </FormControl>
        </div>

        {isSupertonic && (
            <div className="flex flex-col gap-4 border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                    <IconTune fontSize="small" />
                    Supertonic Settings
                </div>
                <div className="flex flex-col gap-4 md:flex-row">
                    <FormControl className="flex-1">
                        <FormLabel>Voice</FormLabel>
                        <Select
                            disabled={props.isPending}
                            value={selectedVoiceStyle}
                            onChange={(_, v) => v && setSelectedVoiceStyle(v)}
                        >
                            <Option value="" disabled>Male voices</Option>
                            {maleVoices.map(v => (
                                <Option key={v.id} value={v.id}>{v.name} ({v.id})</Option>
                            ))}
                            <Option value="" disabled>Female voices</Option>
                            {femaleVoices.map(v => (
                                <Option key={v.id} value={v.id}>{v.name} ({v.id})</Option>
                            ))}
                        </Select>
                        <FormHelperText>Speaker voice — M1–M5 are male, F1–F5 are female.</FormHelperText>
                    </FormControl>
                    <FormControl className="flex-1">
                        <FormLabel>Quality: {selectedSteps} steps</FormLabel>
                        <Slider
                            disabled={props.isPending}
                            aria-label="quality steps"
                            value={selectedSteps}
                            step={1}
                            marks={stepsMarks}
                            onChange={(_, v) => setSelectedSteps(v as number)}
                            min={MIN_STEPS}
                            max={MAX_STEPS}
                            valueLabelDisplay="auto"
                        />
                        <FormHelperText>
                            Diffusion refinement passes. 5 = fast · 8 = balanced · 12 = best quality.
                        </FormHelperText>
                    </FormControl>
                </div>
            </div>
        )}

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
        <div className="flex gap-2 self-end">
            {props.onRead && (
                <Button
                    disabled={props.isSharePending}
                    onClick={props.onRead}
                    variant="outlined"
                    className="gap-2"
                >
                    <IconRead />
                    Read
                </Button>
            )}
            <Button
                disabled={props.isPending}
                loading={props.isPending}
                type="submit"
                className="gap-2"
            >
                {props.isPending ? <LoadingIcon /> : <GenerateIcon />}
                {props.isPending ? 'Generating' : 'Synthesize'}
            </Button>
        </div>

    </form>
}
