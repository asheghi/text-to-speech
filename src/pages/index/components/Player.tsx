import DownloadIcon from '@mui/icons-material/Download';

interface IPlayerProps {
    url: string | undefined,
    className?: string;
    filename?: string;
}
export const Player = (props: IPlayerProps) => {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:pr-1">Audio</span>
            <audio
                className="flex-grow h-10 min-w-0 studio-audio"
                controls
                autoPlay
                src={props.url}
            >
                Your browser does not support the audio element.
            </audio>
            <a
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                href={props.url}
                download={props.filename}
            >
                Download
                <DownloadIcon fontSize="small" />
            </a>
        </div>
    );
}
