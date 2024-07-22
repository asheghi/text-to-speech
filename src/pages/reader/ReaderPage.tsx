/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Display } from "./components/Display";
import { Player } from "./components/Player";
import { SentenceType } from "./types/SentenceType";
import { getTtsLink } from "./utils/getTtsLink";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";
import useAudioPlayer from "./hooks/useAudioPlayer";
import qs from 'qs'
import { Page } from "@/components/Page";

// create a function to create random string
export function createRandomString(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result
}

function splitToSentences(text: string): SentenceType[] {
    text = text.replaceAll("\\n", "").replaceAll('-', '').replaceAll("\\\"", "").replaceAll("\"", "").replaceAll("#", "")
    return text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|!|:)\s/)
        .map((sentence) => sentence.trim().toLowerCase())
        .map(it => it.trim()).filter(it => it && it.length)
        .map((it, index) => {
            return {
                text: it,
                id: index,
            }
        });
}




async function loadSentences(urls: string[]): Promise<void> {
    for await (const url of urls) {
        await fetchUntilFirstByte(url);
    }
}

const ReaderPage = (): JSX.Element => {
    const params = qs.parse(window.location.search, { ignoreQueryPrefix: true }) as { text: string | undefined, model: string | undefined }
    const text = params?.text ?? '';
    const model = params?.model ?? '';
    const sentences = splitToSentences(text);

    const [autoPlay, setAutoPlay] = useState(() => {
        return !!localStorage.getItem('autoPlay') ?? false;
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

    const {
        isPlaying,
        isPending,
        currentTrackIndex,
        setPlaylist,
        play,
        pause,
        playNext,
        playPrevious,
        addEventListener,
        removeEventListener,
        setCurrentTrackIndex,
    } = useAudioPlayer({ autoPlay, delay, sentences });

    useEffect(() => {
        const links = sentences.map(it => {
            const url = getTtsLink(it.text, model);
            return url;
        });

        // trigger loading audio files one by one
        loadSentences(links);

        setPlaylist(links);

        const handleFinish = () => console.log('Audio finished playing');
        addEventListener('finish', handleFinish);

        return () => {
            removeEventListener('finish', handleFinish);
        };
    }, []);

    // preload next sentences
    useEffect(() => {
        sentences.forEach(it => {
            const url = getTtsLink(it.text, model);
            fetchUntilFirstByte(url)
        });
    }, []);


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

    return (
        <Page headerTitle="Reader" backLink="/" >
            <main className="container h-full flex-grow flex flex-col pb-4">
                <Display
                    onSelect={handleSelect}
                    sentences={sentences}
                    activeSentenceId={currentTrackIndex}
                    isPending={isPending}
                />
                <Player
                    isPending={isPending}
                    onTogglePlay={isPlaying ? pause : play}
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
                />
            </main>
        </Page>
    )
}

export default ReaderPage;