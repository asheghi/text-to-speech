import {
    Button, Divider, FormControl, FormHelperText, FormLabel,
    Modal, ModalClose, ModalDialog, Slider, Typography, Select, Option,
} from "@mui/joy"
import IconSpeaker from '@mui/icons-material/RecordVoiceOverOutlined'
import IconLanguage from '@mui/icons-material/LanguageOutlined'
import IconTune from '@mui/icons-material/TuneOutlined'
import { trpc } from "@/api";
import { useCallback, useMemo } from "react";
import { languageList } from "@/pages/index/components/consts/languageList";
import Dropdown from "./Dropdown";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import {
    SUPERTONIC_VOICES,
    DEFAULT_STEPS, MIN_STEPS, MAX_STEPS,
    DEFAULT_VOICE_STYLE,
} from '#/lib/supertonicVoices';

interface IProps {
    onModelSelect: (model: string) => void;
    model: string | undefined;
    language: string | undefined;
    onClose: () => void;
    onLanguageSelect: (arg: string) => void;
    speed: number;
    onSpeedChange: (arg: number) => void;
    steps: number;
    onStepsChange: (arg: number) => void;
    voiceStyle: string;
    onVoiceStyleChange: (arg: string) => void;
}

export const SpeakerModal = (props: IProps) => {
    const modelsQuery = trpc.tts.getModelsList.useQuery();

    const [selectedLanguage, setSelectedLanguage] = useLocalStorageState<string>('language', 'en')
    const [selectedModel, setSelectedModel] = useLocalStorageState<string>('model', '')
    const [selectedSpeed, setSelectedSpeed] = useLocalStorageState('speed', 1)
    const [selectedSteps, setSelectedSteps] = useLocalStorageState('steps', DEFAULT_STEPS)
    const [selectedVoiceStyle, setSelectedVoiceStyle] = useLocalStorageState('voiceStyle', DEFAULT_VOICE_STYLE)

    const getModelsForLanguage = useCallback((languageCode: string | undefined | null) => (modelsQuery.data ?? []).filter(model => {
        return model.modelName.toLowerCase().includes(`-${languageCode}-`) || model.modelName.toLowerCase().includes(`-${languageCode}_`);
    }), [modelsQuery.data]);

    const filteredModels = useMemo(() => {
        if (!modelsQuery.data) return []
        if (!selectedLanguage || !selectedLanguage?.length) return modelsQuery.data ?? [];
        return getModelsForLanguage(selectedLanguage);
    }, [modelsQuery.data, selectedLanguage, getModelsForLanguage]);

    const filteredLanguages = useMemo(() => {
        if (!modelsQuery.data) return languageList;
        return languageList.filter((language) => {
            const list = getModelsForLanguage(language.code) ?? []
            return list.length > 0;
        });
    }, [modelsQuery.data, getModelsForLanguage]);

    // Detect if the currently-selected model is a Supertonic model
    const selectedModelData = useMemo(
        () => modelsQuery.data?.find(m => m.modelName === selectedModel),
        [modelsQuery.data, selectedModel],
    );
    const isSupertonic = selectedModelData?.family === 'supertonic';

    const languageOptions = filteredLanguages.map(it => ({ value: it.code, lable: `${it.name} (${it.nativeName})` }));
    const dropdownLanguageValue = useMemo(() => {
        if (!selectedLanguage) return undefined;
        const lable = languageOptions.find(it => it.value === selectedLanguage)?.lable;
        return { value: selectedLanguage, lable };
    }, [languageOptions, selectedLanguage])

    const modelOptions = filteredModels.map(it => ({ value: it.modelName, lable: formatModelName(it.modelName) }));
    const dropdownModelValue = useMemo(() => {
        if (!selectedModel) return undefined;
        const lable = modelOptions.find(it => it.value === selectedModel)?.lable;
        return { value: selectedModel, lable };
    }, [modelOptions, selectedModel])

    const didFormChange = useMemo(() => {
        if (props.speed !== selectedSpeed) return true;
        if (props.model !== selectedModel) return true;
        if (props.steps !== selectedSteps) return true;
        if (props.voiceStyle !== selectedVoiceStyle) return true;
        return false;
    }, [props.model, props.speed, props.steps, props.voiceStyle,
        selectedModel, selectedSpeed, selectedSteps, selectedVoiceStyle])

    if (modelsQuery.isPending) return <p>Loading...</p>
    if (modelsQuery.isError) return <p>Error</p>

    const handleLanguageSelect = (newValue: string): void => {
        setSelectedLanguage(newValue);
        const it = getModelsForLanguage(newValue)[0];
        if (!it) return;
        setSelectedModel(it.modelName);
    };

    const handleSubmit = (): void => {
        selectedModel && selectedModel !== props.model && props.onModelSelect(selectedModel)
        selectedLanguage && selectedLanguage !== props.language && props.onLanguageSelect(selectedLanguage);
        selectedSpeed !== props.speed && props.onSpeedChange(selectedSpeed);
        selectedSteps !== props.steps && props.onStepsChange(selectedSteps);
        selectedVoiceStyle !== props.voiceStyle && props.onVoiceStyleChange(selectedVoiceStyle);
        props.onClose();
    }

    const speedMarks = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(it => ({ value: it, label: it }))

    const stepsMarks = [2, 4, 6, 8, 10, 12, 14, 16].map(it => ({ value: it, label: it }))

    const maleVoices = SUPERTONIC_VOICES.filter(v => v.gender === 'Male');
    const femaleVoices = SUPERTONIC_VOICES.filter(v => v.gender === 'Female');

    return <Modal open onClose={props.onClose}>
        <ModalDialog minWidth={440}>
            <ModalClose />
            <Typography>Speaker</Typography>
            <Divider />
            <div className="flex flex-col gap-4">
                <FormControl className="flex-1">
                    <FormLabel>
                        <IconLanguage />
                        Language
                    </FormLabel>
                    <Dropdown
                        options={languageOptions}
                        value={dropdownLanguageValue}
                        onChange={({ value }) => handleLanguageSelect(value)}
                        placeholder="Select a language"
                    />
                </FormControl>
                <FormControl className="flex-1">
                    <FormLabel>
                        <IconSpeaker />
                        Model
                    </FormLabel>
                    <Dropdown
                        options={modelOptions}
                        value={dropdownModelValue}
                        placeholder="Select a model"
                        onChange={({ value }) => setSelectedModel(value)} />
                </FormControl>

                <FormControl className="flex-1">
                    <FormLabel>
                        <IconSpeaker />
                        Speed {selectedSpeed}
                    </FormLabel>
                    <Slider
                        aria-label="speech speed"
                        value={selectedSpeed}
                        step={0.05}
                        marks={speedMarks}
                        onChange={(_, v) => setSelectedSpeed(v as number)}
                        min={0}
                        max={2}
                        valueLabelDisplay="auto"
                    />
                    <FormHelperText>Speaking rate. 1.0 is natural speed.</FormHelperText>
                </FormControl>

                {isSupertonic && <>
                    <Divider />
                    <Typography level="title-sm" startDecorator={<IconTune />}>
                        Supertonic Settings
                    </Typography>

                    <FormControl>
                        <FormLabel>Voice</FormLabel>
                        <Select
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

                    <FormControl>
                        <FormLabel>Quality: {selectedSteps} steps</FormLabel>
                        <Slider
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
                            Number of diffusion refinement passes.
                            More steps = richer audio, slower generation.
                            5 = fast preview · 8 = everyday · 12 = best quality.
                        </FormHelperText>
                    </FormControl>
                </>}

                <Divider />
                <div className="flex justify-end">
                    <Button variant="solid" color="primary" onClick={handleSubmit} disabled={!didFormChange}>
                        Select
                    </Button>
                </div>
            </div>
        </ModalDialog>
    </Modal>
}

function formatModelName(name: string): string {
    return name;
}
