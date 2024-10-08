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

function splitToSentences(text: string): SentenceType[] {
    return text.split('\n')
        .map(it => it + '\n')
        .flatMap(it => {
            return it
                .replace(/".*"/g, match => match + '|')
                .replace(/\. /g, '.|')
                .replace(/:+/g, ':|')
                .replace(/\?/g, '?|')
                .replace(/!/g, '!|')
                .replace(/;/g, ';|')
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
    const params = qs.parse(window.location.search, { ignoreQueryPrefix: true }) as { text: string | undefined, model: string | undefined }
    const text = params?.text ?? '';
    const model = params?.model ?? '';
    const sentences = splitToSentences(text);

    console.log("text:", text);
    console.log("sentences:", sentences);

    const [isLoop,setIsLoop] = useState(false);


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

    const links = sentences.map(it => {
        const url = getTtsLink(it, model);
        return url;
    });

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

    return (
        <Page headerTitle="Reader" backLink="/">
            <main className="container h-full flex-grow flex flex-col gap-2">
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
                    isWaiting={isWaiting}
                    onLoopChange={handleLoopChange}
                    isLoop={isLoop}
                />
            </main>
        </Page>
    )
}

export default ReaderPage;