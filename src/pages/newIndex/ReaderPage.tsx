/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Display } from "./components/Display";
import { Player } from "./components/Player";
import { SentenceType } from "./types/SentenceType";
import { getTtsLink } from "./utils/getTtsLink";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";
import useAudioPlayer from "./hooks/useAudioPlayer";
import IconSpeaker from '@mui/icons-material/RecordVoiceOver'

import { Page } from "@/components/Page";
import { useSource } from "./hooks/useSource";
import { IconButton, Typography, CircularProgress, Alert } from "@mui/joy";
import { SpeakerModal } from "./components/SpeakerModal";
import { trpc } from "../../api";

function splitToSentences(text: string): SentenceType[] {
    return text.split('\n')
        .map(it => it + '\n')
        .flatMap(it => {

            return it
                .replace(/"([^"]+)"/g, (match, content) => {
                    if (content.length > 12) {
                        return `|"${content}"|`;
                    }
                    return match;
                })
                .replace(/\. (?=(?:[^"]*"[^"]*")*[^"]*$)/g, '.|')
                .replace(/\.(?=(?:[^"]*"[^"]*")*[^"]*$)/g, '.|')
                .replace(/:+(?=(?:[^"]*"[^"]*")*[^"]*$)/g, ':|')
                .replace(/\?(?=(?:[^"]*"[^"]*")*[^"]*$)/g, '?|')
                .replace(/!(?=(?:[^"]*"[^"]*")*[^"]*$)/g, '!|')
                .replace(/;(?=(?:[^"]*"[^"]*")*[^"]*$)/g, ';|')
                .replace(/" ([A-Z])/g, '"|$1')
                .split("|")
        })
        .map((it, index, arr) => {
            if (arr[index + 1] === '\n') {
                return it + '\n';
            }
            return it;
        })
        .filter(it => !!it.trim().length)
}

async function loadSentences(urls: string[]): Promise<void> {
    for await (const url of urls) {
        await fetchUntilFirstByte(url);
    }
}

const ReaderPage = (): JSX.Element => {
    const { shareId } = useParams();
    const [showSpeakerModal, setShowSpeakerModal] = useState(false);
    const { changeSpeed, model, speed, text, language, changeLanguage, changeModel, changeText } = useSource()
    
    // Fetch shared content if shareId is present
    const { data: sharedContent, isLoading: isLoadingSharedContent, error: sharedContentError } = trpc.tts.getSharedContent.useQuery(
        { shareId: shareId! },
        { 
            enabled: !!shareId,
            retry: false 
        }
    );
    
    // Update text when shared content is loaded
    useEffect(() => {
        if (sharedContent?.content && shareId) {
            changeText(sharedContent.content);
        }
    }, [sharedContent, shareId, changeText]);

    const sentences = splitToSentences(text);


    console.log("text:", text);
    console.log("speed:", speed);
    console.log("sentences:", sentences);
    console.log("language:", language);
    console.log("model:", model);

    const [isLoop, setIsLoop] = useState(false);

    const [autoPlay, setAutoPlay] = useState(() => {
        return !!localStorage.getItem('autoPlay');
    });

    const [delay, setDelay] = useState(() => {
        const d = localStorage.getItem('delay') ?? "";
        try {
            return JSON.parse(d);
            // eslint-disable-next-line no-empty
        } catch (error) {
        }
        return 0;
    });

    const links = useMemo(() => sentences.map(it => {
        const url = getTtsLink(it, model ?? "", speed);
        return url;
    }), [model, sentences, speed]);

    const {
        isPlaying,
        isPending,
        currentTrackIndex,
        play,
        pause,
        playNext,
        playPrevious,
        setCurrentTrackIndex,
        isWaiting,
        stop,
    } = useAudioPlayer({ autoPlay, delay, sentences, playlist: links, loop: isLoop });

    // preload next 3 sentence
    useEffect(() => {
        if (currentTrackIndex >= links.length - 2) {
            return;
        }
        loadSentences([links[currentTrackIndex + 1]]);
        loadSentences([links[currentTrackIndex + 2]]);
        loadSentences([links[currentTrackIndex + 3]]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrackIndex]);

    useEffect(() => {
        return () => {
            try {
                stop();
            } catch (ignored) {
                console.log(ignored);

            }
        }
    }, [])


    useEffect(() => {
        if (!model.length) {
            setShowSpeakerModal(true);
        }
    }, [])

    function handleSelect(id: number): void {
        setCurrentTrackIndex(id)
    }

    function handleActiveIndexChange(index: number): void {
        setCurrentTrackIndex(index)
    }


    const handleAutoPlayChange = (value: boolean) => {
        setAutoPlay(value);
        value ? localStorage.setItem('autoPlay', 'true') : localStorage.removeItem('autoPlay');
    }

    const handleDelayChange = (newDelay: number | string) => {
        setDelay(newDelay)
        localStorage.setItem('delay', JSON.stringify(newDelay));
    }

    function handleLoopChange(selected: boolean): void {
        setIsLoop(selected);
    }

    function handleShowSpeakerModal(): void {
        setShowSpeakerModal(true);
    }

    console.log("check", { model, speed, text });

    // Show loading state for shared content
    if (shareId && isLoadingSharedContent) {
        return (
            <Page headerTitle="Babble Bot" headerEnd={
                <IconButton onClick={handleShowSpeakerModal}>
                    <IconSpeaker />
                </IconButton>
            }>
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <CircularProgress size="lg" />
                        <Typography level="body-lg" className="mt-4">
                            Loading shared content...
                        </Typography>
                    </div>
                </div>
            </Page>
        );
    }

    // Show error state for shared content
    if (shareId && sharedContentError) {
        return (
            <Page headerTitle="Babble Bot" headerEnd={
                <IconButton onClick={handleShowSpeakerModal}>
                    <IconSpeaker />
                </IconButton>
            }>
                <div className="h-full flex items-center justify-center p-4">
                    <Alert color="danger" variant="soft" className="max-w-md">
                        <Typography level="title-md">Content Not Found</Typography>
                        <Typography level="body-md">
                            The shared content you're looking for doesn't exist or has been removed.
                        </Typography>
                    </Alert>
                </div>
            </Page>
        );
    }

    return (
        <Page headerTitle="Babble Bot" headerEnd={
            <IconButton onClick={handleShowSpeakerModal}>
                <IconSpeaker />
            </IconButton>
        }
        >
            <main className="h-full flex-grow flex flex-col gap-2">
                <Display
                    onSelect={handleSelect}
                    sentences={sentences}
                    activeSentenceId={currentTrackIndex}
                    isPending={isPending}
                    text={text}
                    onTextChange={changeText}
                    isReadOnly={!!shareId}
                >

                </Display>
                <Player
                    isPending={isPending}
                    onTogglePlay={isWaiting ? stop : isPlaying ? pause : play}
                    onNext={playNext}
                    onPrev={playPrevious}
                    isPlaying={isPlaying}
                    currentIndex={currentTrackIndex}
                    length={sentences.length}
                    onActiveIndexChange={handleActiveIndexChange}
                    autoPlay={autoPlay}
                    onAutoPlayChange={handleAutoPlayChange}
                    delay={delay}
                    onDelayChange={handleDelayChange}
                    isWaiting={isWaiting}
                    onLoopChange={handleLoopChange}
                    isLoop={isLoop}
                />
            </main>
            {showSpeakerModal && <SpeakerModal
                onLanguageSelect={changeLanguage}
                onModelSelect={changeModel}
                model={model}
                language={language}
                onClose={() => {
                    setShowSpeakerModal(false);
                }}
                speed={speed}
                onSpeedChange={(val) => {
                    changeSpeed(val)
                }}
            />}
        </Page>
    )
}

export default ReaderPage;