import { useEffect, useMemo, useRef, useState } from "react";
import { Display } from "./components/Display";
import { Player } from "./components/Player";
import { SentenceType } from "./types/SentenceType";
import { AudioControls, createAudioPlayer } from "./utils/AudioPlayer";
import { getTtsLink } from "./utils/getTtsLink";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";

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

const ReaderPage = (): JSX.Element => {
    const audioPlayer = useRef<AudioControls>(createAudioPlayer());
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentSentence = useMemo(() => {
        return sentences.find(it => it.id === currentIndex)
    }, [currentIndex]);

    const [isPlaying, setIsPlaying] = useState(false);

    const handleTogglePlay = function (): void {
        audioPlayer.current.play();
    };

    const handleNext = function (): void {
    };

    function handlePrevious(): void {
    }

    const playNextSentence = async () => {
        if (!currentSentence) return;
        const url = getTtsLink(currentSentence.text, model);
        const onAudioEnd = () => {
            setCurrentIndex(prev => {
                if (prev === sentences.length - 1) {
                    return 0;
                }
                return prev + 1;
            });
        };
        fetchUntilFirstByte(url).then(async () => {
            await  new Promise((resolve) => setTimeout(resolve, 3000));
            audioPlayer.current.setUrl(url, onAudioEnd);
            audioPlayer.current.play();
        });
    }

    useEffect(() => {
        playNextSentence()
    }, [currentSentence]);

    useEffect(() => {
        const nextSenetences = sentences.slice(currentIndex + 1, Math.min(currentIndex + 2, sentences.length - 1))
        nextSenetences.forEach(it => {
            const url = getTtsLink(it.text, model);
            fetchUntilFirstByte(url)
        });
    }, [currentIndex]);


    function handleSelect(id: string | number): void {
        setCurrentIndex(id as number);
    }

    return (
        <main className="container mx-auto">
            <Display onSelect={handleSelect} sentences={sentences} activeSentenceId={currentIndex} />
            <Player
                onTogglePlay={handleTogglePlay}
                onNext={handleNext}
                onPrev={handlePrevious}
                isPlaying={false} />
        </main>
    )
}

export default ReaderPage;