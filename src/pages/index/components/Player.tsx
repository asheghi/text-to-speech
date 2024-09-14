import DownloadIcon from '@mui/icons-material/Download';

interface IPlayerProps {
    url: string | undefined,
    className?: string;
    filename?: string;
}
export const Player = (props: IPlayerProps) => {
    return <div className={"form-group flex items-center"}>
        <label className="">Audio:</label>
        <video className="height-8 max-h-14 min-w-[400px] flex-grow bg-gray-100" controls autoPlay>
            <source src={props.url} />
            Your browser does not support the audio element.
        </video>
        <a className="rounded bg-gray-200 text-gray-500 px-3 py-2 font-semibold text-lg flex gap-2" href={props.url} download={props.filename}>Download
            <DownloadIcon />
        </a>
    </div>
}