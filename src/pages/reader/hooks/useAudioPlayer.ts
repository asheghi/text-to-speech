import { useState, useEffect } from 'react';
import { SentenceType } from '../types/SentenceType';
import debug from 'debug'
import { useAudioPlayer as useAudioPlayerReact } from 'react-use-audio-player';


const log = debug('audio-player');
debug.enable("*")

interface AudioPlayerHook {
  isPlaying: boolean;
  isPending: boolean;
  currentTrackIndex: number;
  setCurrentTrackIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  playNext: () => void;
  playPrevious: () => void;
  isWaiting: boolean;
}

const useAudioPlayer = (args: { autoPlay: boolean, delay: number | string, sentences?: SentenceType[], playlist: string[] }): AudioPlayerHook => {
  const [currentAudioIndex, setCurrentIndex] = useState(0);
  const player = useAudioPlayerReact();
  const [delayTimeout,setDelayTimeout] = useState<number>();

  const handlePlayNext = () => setCurrentIndex(p => {
    if (p < args.playlist.length - 1) {
      return p + 1;
    }
    return args.autoPlay ? 0 : p;
  });

  const handlePlayPrevious = () => setCurrentIndex(p => {
    if (p > 0) {
      return p - 1;
    }
    return 0;
  });


  const clearDelayTimeout = () => {
    if(delayTimeout){
      clearTimeout(delayTimeout);
    }
    setDelayTimeout(undefined);
  };

  useEffect(() => {
    log("Loading audio", currentAudioIndex);
    clearDelayTimeout();
    player.load(args.playlist[currentAudioIndex], {
      format: 'wav',
      autoplay: args.autoPlay, onend: () => {
        log("onend", args.autoPlay);
        if (args.delay) {
          clearDelayTimeout();
          let delaySeconds = 0;
          if (args.delay === 'auto') {
            const wordCount = (args?.sentences?.[currentAudioIndex]?.text ?? "").split(' ').length;
            delaySeconds = wordCount * .6 * 1000;
          } else if (typeof args.delay === 'number') {
            delaySeconds = args.delay * 1000;
          }
          setDelayTimeout(setTimeout(() => {
            handlePlayNext();
            clearDelayTimeout();
          }, delaySeconds) as unknown as number);
        } else {
          handlePlayNext();
        }
      }
    });
  }, [currentAudioIndex])



  return {
    setCurrentTrackIndex: setCurrentIndex,
    isPlaying: player.playing,
    play: player.play,
    currentTrackIndex: currentAudioIndex,
    pause: player.pause,
    stop: player.stop,
    playNext: handlePlayNext,
    playPrevious: handlePlayPrevious,
    isPending:  player.isLoading,
    isWaiting: !!delayTimeout,
  }
}

export default useAudioPlayer;