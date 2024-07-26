import './Player.scss'
import { ChangeEvent } from "react";
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import NextIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import PrevIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import PendingIcon from '@mui/icons-material/DownloadingOutlined'
import WaitingIcon from '@mui/icons-material/TimerOutlined'


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
    isPending: boolean;
    isWaiting: boolean;
    onDelayChange : (delay : number | string) => void;
    className?: string;
}

export const Player = (props: IPlayerProps) => {
    function handleSeek(event: ChangeEvent<HTMLInputElement>): void {
        props.onActiveIndexChange(parseInt(event.target.value))
    }

    function handleAutoPlayChange(event: ChangeEvent<HTMLInputElement>): void {
        props.onAutoPlayChange(event.target.checked)
    }

    function handleDelayChange(event: ChangeEvent<HTMLSelectElement>): void {
        const value = event.target.value;
        if(value === 'auto') return props.onDelayChange(value);
        props.onDelayChange(parseInt(value))
    }

    return <div className={props.className}>
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
                <button onClick={props.onTogglePlay}>{props.isWaiting ? <WaitingIcon /> : props.isPending ? <PendingIcon /> : props.isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                <button onClick={props.onNext}>
                    <NextIcon />
                </button>
            </div>
            <div className='flex-1 flex justify-end'>
                <select className='select' onChange={handleDelayChange} value={props.delay}>
                    <option value={0}>No Delay &nbsp;</option>
                    <option value={1}>Delay 1</option>
                    <option value={2}>Delay 2</option>
                    <option value={3}>Delay 3</option>
                    <option value={4}>Delay 4</option>
                    <option value={"auto"}>Auto</option>
                </select>
            </div>
        </div>
    </div>
}