import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerHook {
  isPlaying: boolean;
  duration: number;
  isPending: boolean;
  finished: boolean;
  currentTime: number;
  currentTrackIndex: number;
  setPlaylist: (urls: string[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
}

const useAudioPlayer = (args: { autoPlay: boolean }): AudioPlayerHook => {
  console.log({ args });

  const [playlist, setPlaylistState] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [finished, setFinished] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [renderIndex, setRenderIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const eventListeners = useRef<{ [key: string]: (() => void)[] }>({});
  const playlistRef = useRef<string[]>([]);
  const currentTrackIndexRef = useRef<number>(0);


  const setPlaylist = useCallback((urls: string[]) => {
    setPlaylistState(urls);
    playlistRef.current = urls;
  }, []);

  const setCurrentTrackIndex = useCallback((index: number) => {
    if (index >= 0 && index < playlistRef.current.length) {
      currentTrackIndexRef.current = index;
      setFinished(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.src = playlistRef.current[index];
        play();
      }
    }
    setRenderIndex(r => r + 1);
  }, [isPlaying]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadStart = () => setIsPending(true);
    const handleCanPlay = () => setIsPending(false);
    
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (playlist.length > 0 && audioRef.current) {
      audioRef.current.src = playlist[currentTrackIndexRef.current];
      setFinished(false);
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.play();
      }
      if (args.autoPlay) {
        play();
      }
    }
  }, [playlist, isPlaying]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setFinished(true);
    triggerEvent('finish');
    if (args.autoPlay) {
      playNext();
    }
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const play = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setFinished(false);
      } catch (ignored) {
        console.log(ignored);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setFinished(false);
      setCurrentTime(0);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const playNext = useCallback(() => {
    const nextIndex = (currentTrackIndexRef.current + 1) % playlistRef.current.length;
    setCurrentTrackIndex(nextIndex);
  }, [setCurrentTrackIndex]);

  const playPrevious = useCallback(() => {
    const prevIndex = (currentTrackIndexRef.current - 1 + playlistRef.current.length) % playlistRef.current.length;
    setCurrentTrackIndex(prevIndex);
  }, [setCurrentTrackIndex]);

  const addEventListener = useCallback((event: string, callback: () => void) => {
    if (!eventListeners.current[event]) {
      eventListeners.current[event] = [];
    }
    eventListeners.current[event].push(callback);
  }, []);

  const removeEventListener = useCallback((event: string, callback: () => void) => {
    if (eventListeners.current[event]) {
      eventListeners.current[event] = eventListeners.current[event].filter(
        (cb) => cb !== callback
      );
    }
  }, []);

  const triggerEvent = useCallback((event: string) => {
    if (eventListeners.current[event]) {
      eventListeners.current[event].forEach((callback) => callback());
    }
  }, []);

  return {
    isPlaying,
    duration,
    isPending,
    finished,
    currentTime,
    currentTrackIndex: currentTrackIndexRef.current,
    setPlaylist,
    setCurrentTrackIndex,
    play,
    pause,
    stop,
    seek,
    playNext,
    playPrevious,
    addEventListener,
    removeEventListener,
  };
};

export default useAudioPlayer;