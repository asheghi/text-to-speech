import { useState } from "react";
import DownloadIcon from '@mui/icons-material/Download';
import type { SynthStats } from "../IndexPage";

interface IPlayerProps {
    url: string | undefined;
    className?: string;
    filename?: string;
    stats?: SynthStats;
}

function fmt(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function fmtDuration(s: number): string {
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    const rem = (s % 60).toFixed(0).padStart(2, '0');
    return `${m}:${rem}`;
}

type Stat = { label: string; value: string; title?: string };

export const Player = (props: IPlayerProps) => {
    const [audioDuration, setAudioDuration] = useState<number | undefined>();

    const stats: Stat[] = [];
    if (props.stats) {
        const { generationMs, wordCount, charCount } = props.stats;
        stats.push({ label: 'Generated in', value: fmt(generationMs), title: `${generationMs}ms` });
        stats.push({ label: 'Words', value: String(wordCount) });
        stats.push({ label: 'Chars', value: String(charCount) });
        if (audioDuration !== undefined && audioDuration > 0) {
            stats.push({ label: 'Duration', value: fmtDuration(audioDuration) });
            if (wordCount > 0) {
                const wpm = Math.round(wordCount / (audioDuration / 60));
                stats.push({ label: 'Speaking rate', value: `${wpm} WPM`, title: 'Words per minute in the audio' });
            }
            if (generationMs > 0) {
                const rtf = (generationMs / 1000 / audioDuration).toFixed(2);
                stats.push({ label: 'RTF', value: `${rtf}×`, title: `Real-time factor: generation time ÷ audio duration. Lower is faster.` });
            }
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {/* audio bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:pr-1">Audio</span>
                <audio
                    className="flex-grow h-10 min-w-0 studio-audio"
                    controls
                    autoPlay
                    src={props.url}
                    onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration)}
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

            {/* stats chips */}
            {stats.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {stats.map(s => (
                        <div
                            key={s.label}
                            title={s.title}
                            className="flex items-baseline gap-1.5 rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1"
                        >
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{s.label}</span>
                            <span className="text-xs font-semibold text-slate-200">{s.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
