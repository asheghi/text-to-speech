import './Player.scss'
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import NextIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import PrevIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import PendingIcon from '@mui/icons-material/DownloadingOutlined'
import WaitingIcon from '@mui/icons-material/TimerOutlined'
import { Badge, Dropdown, IconButton, Menu, MenuButton, MenuItem, Slider, Tooltip } from '@mui/joy';
import AutoPlayIcon from '@mui/icons-material/SlowMotionVideo';
import RepeatIcon from '@mui/icons-material/Repeat';
import DelayIcon from '@mui/icons-material/Timer';


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
    onDelayChange: (delay: number | string) => void;
    className?: string;
    onLoopChange: (selected: boolean) => void;
    isLoop: boolean;
}

export const Player = (props: IPlayerProps) => {
    function handleSeek(_event: Event,number: number | number[]): void {
        if(Array.isArray(number)){
            return;
        }
        props.onActiveIndexChange(number)
    }

    function handleAutoPlayChange(): void {
        props.onAutoPlayChange(!props.autoPlay)
    }

    function handleLoopChange(): void {
        props.onLoopChange(!props.isLoop);
    }

    function handleDelaySelect(arg0: number | 'auto'): void {
        props.onDelayChange(arg0)
    }

    return <div className={"player " + props.className + ' bg-white '}>
        <Slider value={props.currentIndex} max={props.length - 1} min={0} onChange={handleSeek} />
        <div className="flex ">
            <div className='flex-1 flex gap-2 items-center'>
                <Tooltip title="Auto Play">
                    <IconButton onClick={handleAutoPlayChange} aria-label='Auto Play'>
                        <AutoPlayIcon color={props.autoPlay ? 'primary' : 'disabled'} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Repeat">
                    <IconButton onClick={handleLoopChange} aria-label='Repeat'>
                        <RepeatIcon color={props.isLoop ? 'primary' : 'disabled'} />
                    </IconButton>
                </Tooltip>
            </div>
            <div className="center-buttons flex-1">
                <Tooltip title="Previous">

                    <IconButton onClick={props.onPrev}>
                        <PrevIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title={props.isWaiting ? "Waiting..." : props.isPending ? "Loading..." : props.isPlaying ? "Pause" : "Play"}>

                    <IconButton onClick={props.onTogglePlay}>
                        {props.isWaiting ? <WaitingIcon /> : props.isPending ? <PendingIcon /> : props.isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Next">

                    <IconButton onClick={props.onNext}>
                        <NextIcon />
                    </IconButton>
                </Tooltip>
            </div>
            <div className='flex-1 flex justify-end'>
                <Dropdown>
                    <MenuButton
                        slots={{ root: Badge }}
                        slotProps={{ root: { badgeContent: props.delay, color: 'neutral',  } }}
                    >
                        <DelayIcon color={props.delay ? 'action' : 'disabled'}/>
                    </MenuButton>
                    <Menu>
                        <MenuItem onClick={() => handleDelaySelect(0)}>No Delay</MenuItem>
                        <MenuItem onClick={() => handleDelaySelect(1)}>1 Second</MenuItem>
                        <MenuItem onClick={() => handleDelaySelect(2)}>2 Seconds</MenuItem>
                        <MenuItem onClick={() => handleDelaySelect(3)}>3 Seconds</MenuItem>
                        <MenuItem onClick={() => handleDelaySelect(4)}>4 Seconds</MenuItem>
                        <MenuItem onClick={() => handleDelaySelect(5)}>5 Seconds</MenuItem>
                        <MenuItem onClick={() => handleDelaySelect('auto')}>Auto</MenuItem>
                    </Menu>
                </Dropdown>
            </div>

        </div>
    </div>
}