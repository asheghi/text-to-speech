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

// Dark-theme sx overrides for MUI Joy form controls.
const darkInputSx = {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    color: '#e2e8f0',
    borderColor: 'rgba(71, 85, 105, 0.8)',
    '&:hover': {
        borderColor: 'rgba(99, 102, 241, 0.6)',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
    },
    '&.Mui-focused, &:focus-within': {
        borderColor: '#818cf8',
        '--Input-focusedHighlight': '#818cf8',
    },
    '&.Mui-disabled': {
        opacity: 0.6,
    },
    '--Input-placeholderColor': 'rgba(148, 163, 184, 0.7)',
};

const darkLabelSx = {
    color: '#cbd5e1',
    fontWeight: 500,
    '& svg': { color: '#94a3b8' },
};

const darkHelperSx = {
    color: '#94a3b8',
    fontSize: '0.75rem',
};

const darkSelectSx = {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    color: '#e2e8f0',
    borderColor: 'rgba(71, 85, 105, 0.8)',
    '&:hover': {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderColor: 'rgba(99, 102, 241, 0.6)',
    },
    '& .MuiSelect-indicator': { color: '#94a3b8' },
};

const darkSelectListboxSx = {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderColor: 'rgba(71, 85, 105, 0.8)',
    '& .MuiOption-root': {
        color: '#e2e8f0',
        '&:hover': {
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
        },
        '&[aria-selected="true"]': {
            backgroundColor: 'rgba(99, 102, 241, 0.3)',
            color: '#fff',
        },
        '&.Mui-disabled': {
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 1,
        },
    },
};

const darkSliderSx = {
    '--Slider-trackBackground': 'linear-gradient(90deg, #a855f7, #6366f1)',
    '--Slider-railBackground': 'rgba(71, 85, 105, 0.6)',
    '--Slider-thumbBackground': '#fff',
    '& .MuiSlider-mark': { backgroundColor: 'rgba(148, 163, 184, 0.6)' },
    '& .MuiSlider-markLabel': { color: '#94a3b8', fontSize: '0.7rem' },
    '& .MuiSlider-valueLabel': {
        backgroundColor: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(99, 102, 241, 0.5)',
    },
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
        return <p className="text-slate-300">Loading models…</p>
    }

    if (modelsQuery.isError) {
        return <p className="text-rose-300">Failed to load models.</p>
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

    return <form onSubmit={handleFormSubmit} className="form studio-form">
        <div className="flex flex-col gap-4 md:flex-row">
            <FormControl className="flex-1">
                <FormLabel sx={darkLabelSx}>
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
                <FormLabel sx={darkLabelSx}>
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
            <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <IconTune fontSize="small" />
                    Supertonic Settings
                </div>
                <div className="flex flex-col gap-4 md:flex-row">
                    <FormControl className="flex-1">
                        <FormLabel sx={darkLabelSx}>Voice</FormLabel>
                        <Select
                            disabled={props.isPending}
                            value={selectedVoiceStyle}
                            onChange={(_, v) => v && setSelectedVoiceStyle(v)}
                            sx={darkSelectSx}
                            slotProps={{ listbox: { sx: darkSelectListboxSx } }}
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
                        <FormHelperText sx={darkHelperSx}>Speaker voice — M1–M5 are male, F1–F5 are female.</FormHelperText>
                    </FormControl>
                    <FormControl className="flex-1">
                        <FormLabel sx={darkLabelSx}>Quality: {selectedSteps} steps</FormLabel>
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
                            sx={darkSliderSx}
                        />
                        <FormHelperText sx={darkHelperSx}>
                            Diffusion refinement passes. 5 = fast · 8 = balanced · 12 = best quality.
                        </FormHelperText>
                    </FormControl>
                </div>
            </div>
        )}

        <FormControl>
            <FormLabel sx={darkLabelSx}>
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
                sx={darkInputSx}
            />
            <FormHelperText sx={darkHelperSx}>text can be very long</FormHelperText>
        </FormControl>
        {props.player}
        <div className="flex gap-2 self-end">
            {props.onRead && (
                <Button
                    disabled={props.isSharePending}
                    onClick={props.onRead}
                    variant="outlined"
                    className="gap-2"
                    sx={{
                        borderColor: 'rgba(71, 85, 105, 0.8)',
                        color: '#cbd5e1',
                        '&:hover': {
                            backgroundColor: 'rgba(51, 65, 85, 0.5)',
                            borderColor: '#818cf8',
                            color: '#fff',
                        },
                    }}
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
                sx={{
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 500,
                    '&:hover': {
                        background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
                    },
                    '&.Mui-disabled': {
                        background: 'rgba(99, 102, 241, 0.4)',
                        color: 'rgba(255, 255, 255, 0.7)',
                    },
                }}
            >
                {props.isPending ? <LoadingIcon /> : <GenerateIcon />}
                {props.isPending ? 'Generating' : 'Synthesize'}
            </Button>
        </div>

    </form>
}
