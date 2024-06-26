/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useRef, useState } from "react";
import { Display } from "./components/Display";
import { Player } from "./components/Player";
import { SentenceType } from "./types/SentenceType";
import { getTtsLink } from "./utils/getTtsLink";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";
import useAudioPlayer from "./hooks/useAudioPlayer";

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
    text = text.replaceAll("\\n", "").replaceAll('-', '').replaceAll("\\\"", "").replaceAll("\"", "")
    const sentences = text.replaceAll(/\n/g, '').split(/[.!?]+/).map((sentence) => sentence.trim().toLowerCase());
    return sentences.map(it => it.trim()).filter(it => it && it.length).map((it, index) => {
        return {
            text: it,
            id: index,
        }
    });
}

const text = localStorage.getItem('text') ?? "";
const modelJSON = localStorage.getItem('model') ?? "";
const languageJSON = localStorage.getItem('language') ?? "";
const language = JSON.parse(languageJSON).value;
const model = JSON.parse(modelJSON).value;

const sentences = splitToSentences(text);


async function loadSentences(urls: string[]): Promise<void> {
    for await (const url of urls) {
        await fetchUntilFirstByte(url);
    }
}

const ReaderPage = (): JSX.Element => {
    const [autoPlay, setAutoPlay] = useState(() => {
        return !!localStorage.getItem('autoPlay') ?? false;
    });

    const {
        isPlaying,
        duration,
        isPending,
        finished,
        currentTime,
        currentTrackIndex,
        setPlaylist,
        play,
        pause,
        stop,
        seek,
        playNext,
        playPrevious,
        addEventListener,
        removeEventListener,
        setCurrentTrackIndex,
    } = useAudioPlayer({ autoPlay });


    console.log(`check::`, { isPlaying, isPending, finished, currentTrackIndex, duration, currentTime, length: sentences.length });



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
        const nextSenetences = sentences.slice(currentTrackIndex + 1, Math.min(currentTrackIndex + 2, sentences.length - 1))
        nextSenetences.forEach(it => {
            const url = getTtsLink(it.text, model);
            fetchUntilFirstByte(url)
        });
    }, [currentTrackIndex]);


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

    return (
        <main className="container mx-auto">
            <Display
                onSelect={handleSelect}
                sentences={sentences}
                activeSentenceId={currentTrackIndex}
            />
            <Player
                onTogglePlay={isPlaying ? pause : play}
                onNext={playNext}
                onPrev={playPrevious}
                isPlaying={isPlaying}
                currentIndex={currentTrackIndex}
                length={sentences.length}
                onActiveIndexChange={handleActiveIndexChange}
                autoPlay={autoPlay}
                onAutoPlayChange={handleAutoPlayChange}

            />
        </main>
    )
}

export default ReaderPage;