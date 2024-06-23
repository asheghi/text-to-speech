import { RequestState } from "./consts/RequestState"

interface IPlayerProps {
    state: RequestState | undefined,
    url: string | undefined,
    className?: string;
    filename?: string;
}
export const Player = (props: IPlayerProps) => {
    if (!props.state) return;

    if (props.state === RequestState.FAILED) {
        return <p>Failed to generate audio</p>
    }

    if (props.state === RequestState.PENDING) {
        return <p className="text-center">Generating...</p>
    }

    return <div className={props.className + ` flex gap-2 items-center`}>
        <label className="font-bold min-w-[120px]">Audio</label>
        <video className="height-8 max-h-14 min-w-[400px]" controls autoPlay>
            <source src={props.url} type="audio/wav" />
            Your browser does not support the audio element.
        </video>
        <a className="rounded bg-gray-200 text-gray-500 px-3 py-2 font-semibold text-lg" href={props.url} download={props.filename}>Download 📥</a>
    </div>
}