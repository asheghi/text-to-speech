import './Player.scss'
import { ChangeEvent } from "react";
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import NextIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import PrevIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'


interface IPlayerProps {
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    isPlaying: boolean;
    length: number;
    currentIndex: number;
    onActiveIndexChange: (index: number) => void;
    autoPlay: boolean;
    onAutoPlayChange: (value: boolean) => void;
    delay: number;
    onDelayChange : (delay : number) => void;
}

export const Player = (props: IPlayerProps) => {
    function handleSeek(event: ChangeEvent<HTMLInputElement>): void {
        props.onActiveIndexChange(parseInt(event.target.value))
    }

    function handleAutoPlayChange(event: ChangeEvent<HTMLInputElement>): void {
        props.onAutoPlayChange(event.target.checked)
    }

    function handleDelayChange(event: ChangeEvent<HTMLSelectElement>): void {
        props.onDelayChange(parseInt(event.target.value))
    }

    return <div>
        <input className="slider" type="range" min={0} max={props.length - 1} value={props.currentIndex} onChange={handleSeek} />
        <div className="flex ">
            <div className='flex-1 flex gap-2 items-center'>
                <input
                    checked={props.autoPlay}
                    onChange={handleAutoPlayChange}
                    type="checkbox" id="auto-play" className='h-4 w-4' />
                <label htmlFor="auto-play" className=''>Auto Play</label>
            </div>
            <div className="center-buttons flex-1">
                <button onClick={props.onPrev}>
                    <PrevIcon />
                </button>
                <button onClick={props.onTogglePlay}>{props.isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                <button onClick={props.onNext}>
                    <NextIcon />
                </button>
            </div>
            <div className='flex-1 flex justify-end'>
                <select onChange={handleDelayChange} value={props.delay}>
                    <option value={0}>No Delay &nbsp;</option>
                    <option value={1}>Delay 1</option>
                    <option value={2}>Delay 2</option>
                    <option value={3}>Delay 3</option>
                    <option value={4}>Delay 4</option>
                </select>
            </div>
        </div>
    </div>
}