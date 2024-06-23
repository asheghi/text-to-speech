interface IPlayerProps {
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    isPlaying: boolean;
}

export const Player = (props: IPlayerProps) => {
    return <div className="flex gap-4 justify-center">
        <button onClick={props.onPrev}>P</button>
        <button onClick={props.onTogglePlay}>{props.isPlaying ? "Pause" : "Play"}</button>
        <button onClick={props.onNext}>N</button>
    </div>
}