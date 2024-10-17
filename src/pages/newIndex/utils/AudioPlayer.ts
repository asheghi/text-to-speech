export interface AudioControls {
    play: () => void;
    pause: () => void;
    stop: () => void;
    setVolume: (volume: number) => void;
    playUrl: (url: string, onAudioEnd: () => void) => void;
    setUrl: (url: string, onAudioEnd: () => void) => void;

    // onPlayFinished: (callback: () => void) => void
}

export function createAudioPlayer(): AudioControls {
    let audio: HTMLAudioElement;

    const play = (): void => {
        if (!audio) return;
        audio.play()
            .then(() => {
                console.log('Audio playback started');
            })
            .catch((error) => {
                console.error('Error playing audio:', error);
            });
    };

    const pause = (): void => {
        if (!audio) return;
        audio.pause();
    };

    const stop = (): void => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
    };

    const setVolume = (volume: number): void => {
        if (!audio) return;
        audio.volume = Math.max(0, Math.min(1, volume));
    };

    const setUrl = (url: string, onAudioEnd: () => void): void => {
        stop();
        audio = new Audio(url);
        audio.addEventListener('ended', onAudioEnd)
    };

    const playUrl = (url: string, onAudioEnd: () => void): void => {
        setUrl(url, onAudioEnd)
        play();
    };

    return { play, pause, stop, setVolume, playUrl, setUrl };
}
