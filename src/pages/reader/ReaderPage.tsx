/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { ShareModal } from "../../components/ShareModal";
import { trpc } from "../../api";

function splitToSentences(text: string): SentenceType[] {
    return text
        .split('\n')
        .map(it => it + '\n')
        .flatMap(it => {
            console.log("split text", JSON.stringify(it));
            if(it === '\n' || it === " \n") {
                return [it];
            }
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
            let i = index + 1;
            let appending = "";
            while(i < arr.length - 1) {
                const current = arr[i];
                if (/[a-zA-Z0-9]/.test(current.trim())){
                    break;
                }else{
                    appending += current;
                }
                i++;
            }
            return it + appending;
        })
        .filter(it => /[a-zA-Z0-9]/.test(it.trim()))

}

async function loadSentences(urls: string[]): Promise<void> {
    for await (const url of urls) {
        await fetchUntilFirstByte(url);
    }
}

const ReaderPage = (): JSX.Element => {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const [showSpeakerModal, setShowSpeakerModal] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareContentId, setShareContentId] = useState('');

    const { changeSpeed, model, speed, text, language, changeLanguage, changeModel, changeText } = useSource();

    // Handle text changes when in shared mode
    const handleTextChange = useCallback((newText: string) => {
        changeText(newText);
        if (shareId) {
            navigate('/reader', { replace: true });
        }
    }, [shareId, navigate, changeText]);

    // Share content mutation
    const shareContentMutation = trpc.tts.shareContent.useMutation({
        onSuccess: (data) => {
            setShareContentId(data.shareId);
        },
        onError: (error) => {
            console.error('Failed to share content:', error);
            alert('Failed to create share link. Please try again.');
            setShareModalOpen(false);
        }
    });

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

            // Restore language, model, and speed if they're not already set and shared content has them
            if (sharedContent.language) {
                changeLanguage(sharedContent.language);
            }
            if (sharedContent.model) {
                changeModel(sharedContent.model);
            }
            if (sharedContent.speed && speed === 1) { // Default speed is 1
                changeSpeed(sharedContent.speed);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shareId]);

    const sentences = splitToSentences(text);

    // console.log("text:", text);
    // console.log("speed:", speed);
    // console.log("sentences:", sentences);
    // console.log("language:", language);
    // console.log("model:", model);

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
        // Don't show speaker modal immediately if we're loading shared content
        if (shareId && isLoadingSharedContent) {
            return;
        }

        // If we're in shared mode, only show modal if shared content doesn't have language/model
        if (shareId && sharedContent) {
            if (!model.length && !sharedContent.model) {
                setShowSpeakerModal(true);
            }
            return;
        }

        // Normal mode: show modal if no model is set
        if (!shareId && !model.length) {
            setShowSpeakerModal(true);
        }
    }, [shareId, isLoadingSharedContent, sharedContent, model.length])

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

    function handleShare(): void {
        setShareModalOpen(true);
        shareContentMutation.mutate({
            content: text,
            title: 'Shared Text to Speech',
            language,
            model,
            speed
        });
    }

    const handleCloseShareModal = () => {
        setShareModalOpen(false);
        setShareContentId('');
    };


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
                    onTextChange={handleTextChange}
                    language={language}
                    model={model}
                    speed={speed}
                    onShare={handleShare}
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
            <ShareModal
                open={shareModalOpen}
                onClose={handleCloseShareModal}
                shareId={shareContentId}
                isLoading={shareContentMutation.isPending}
            />
        </Page>
    )
}

export default ReaderPage;