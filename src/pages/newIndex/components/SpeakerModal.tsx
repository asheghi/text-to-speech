import { Button, Divider, FormControl, FormLabel, Modal, ModalClose, ModalDialog, Slider, Typography } from "@mui/joy"
import IconSpeaker from '@mui/icons-material/RecordVoiceOverOutlined'
import IconLanguage from '@mui/icons-material/LanguageOutlined'
import { trpc } from "@/api";
import { useCallback, useMemo, useState } from "react";
import { languageList } from "@/pages/index/components/consts/languageList";
import Dropdown from "./Dropdown";

interface IProps {
    onModelSelect: (model: string) => void;
    model: string | undefined;
    language: string | undefined;
    onClose: () => void;
    onLanguageSelect: (arg: string) => void;
    speed: number;
    onSpeedChange: (arg: number) => void;
}

export const SpeakerModal = (props: IProps) => {
    const modelsQuery = trpc.tts.getModelsList.useQuery();

    const [selectedLanguage, setSelectedLanguage] = useState(props.language);
    const [selectedModel, setSelectedModel] = useState(props.model);
    const [selectedSpeed, setSelectedSpeed] = useState(props.speed)

    const getModelsForLanguage = useCallback((lanaugeCode: string | undefined | null) => (modelsQuery.data ?? []).filter(model => {
        return model.modelName.toLowerCase().includes(`-${lanaugeCode}-`) || model.modelName.toLowerCase().includes(`-${lanaugeCode}_`);
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

    const languageOptions = filteredLanguages.map(it => ({ value: it.code, lable: `${it.name} (${it.nativeName})` }));
    const dropdownLanguageValue = useMemo(() => {
        if (!selectedLanguage) {
            return undefined;
        }
        const lable = languageOptions.find(it => it.value === selectedLanguage)?.lable;
        return { value: selectedLanguage, lable: lable }
    }, [languageOptions, selectedLanguage])

    const modelOptions = filteredModels.map(it => ({ value: it.modelName, lable: formatModelName(it.modelName) }));
    const dorpdownModelValue = useMemo(() => {
        if (!selectedModel) {
            return undefined
        }
        const label = modelOptions.find(it => it.value === selectedModel)?.lable
        return { value: selectedModel, lable: label }
    }, [modelOptions, selectedModel])

    const didFormChange = useMemo(() => {
        if (props.speed !== selectedSpeed) {
            return true;
        }
        if (props.model !== selectedModel) {
            return true;
        }
    }, [props.model, props.speed, selectedModel, selectedSpeed])


    if (modelsQuery.isPending) {
        return <p>Loading...</p>
    }

    if (modelsQuery.isError) {
        return <p>Error</p>
    }

    const handleLanguageSelect = function (newValue: string): void {
        setSelectedLanguage(newValue);
        const it = getModelsForLanguage(newValue)[0];
        if (!it) return;
        setSelectedModel(it.modelName);
    };

    const handleSubmit = (): void => {
        selectedModel && selectedModel !== props.model && props.onModelSelect(selectedModel)
        selectedLanguage && selectedLanguage !== props.language && props.onLanguageSelect(selectedLanguage);
        selectedSpeed !== props.speed && props.onSpeedChange(selectedSpeed);
        props.onClose();
    }

    const handleModelSelect = (model: string) => {
        setSelectedModel(model);
    }

    const marks = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((it) => {
        return {
            value: it,
            label: it,
        }
    })

    console.log("marks", marks)

    const handleSpeedChange = (_: Event, value: number | number[],): void => {
        console.log("on speed change", value)
        setSelectedSpeed(value as number)
    }

    return <Modal open onClose={props.onClose}>
        <ModalDialog minWidth={400}>
            <ModalClose />
            <Typography>Speaker</Typography>
            <Divider />
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 ">
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
                        <FormLabel >
                            <IconSpeaker />
                            Speaker
                        </FormLabel>
                        <Dropdown
                            options={modelOptions}
                            value={dorpdownModelValue}
                            placeholder="Select a speaker"
                            onChange={({ value }) => handleModelSelect(value)} />

                    </FormControl>
                    <FormControl className="flex-1 flex flex-row">
                        <FormLabel >
                            <IconSpeaker />
                            Speed {selectedSpeed}
                        </FormLabel>
                        <Slider
                            aria-label="speaker speed"
                            value={selectedSpeed}
                            step={0.05}
                            marks={marks}
                            onChange={handleSpeedChange}
                            min={0}
                            max={2}
                            valueLabelDisplay="auto"
                        />
                    </FormControl>

                </div>
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
    // const splited = name.split('-');
    // if (splited.length > 3) {
    //     const [type, type2, locale, ...rest] = splited;
    //     return rest.join(' ')
    // }
    return name;
}