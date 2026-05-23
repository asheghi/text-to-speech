import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";
import { Form } from "./components/Form";
import { RequestState } from "./components/consts/RequestState";
import { Player } from "./components/Player";
import qs from 'qs';
import { FormType } from "./FormType";

const appName = (import.meta.env.VITE_APP_TITLE as string | undefined) ?? "Text To Speech";

const Nav = () => (
    <nav className="w-full px-6 md:px-10 py-5 flex items-center justify-between">
        <Link to="/" className="text-white font-semibold tracking-tight text-lg flex items-center gap-2">
            <span className="inline-block w-7 h-7 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-500" />
            {appName}
        </Link>
        <div className="flex items-center gap-2 md:gap-6 text-sm">
            <Link to="/" className="text-slate-300 hover:text-white transition-colors hidden sm:inline">Home</Link>
            <Link to="/reader" className="text-slate-300 hover:text-white transition-colors hidden sm:inline">Reader</Link>
            <Link to="/docs" className="text-slate-300 hover:text-white transition-colors">Docs</Link>
        </div>
    </nav>
);

export type SynthStats = {
    generationMs: number;
    wordCount: number;
    charCount: number;
};

export const IndexPage = (): JSX.Element => {
    const [state, setState] = useState<RequestState | undefined>();
    const [url, setUrl] = useState<string>();
    const [formState, setFormState] = useState<FormType>();
    const [synthStats, setSynthStats] = useState<SynthStats | undefined>();

    const handleFormSubmit = async function (): Promise<void> {
        const query = qs.stringify(formState)
        const url = "/api/tts.wav?" + query;
        setState(RequestState.PENDING);
        setSynthStats(undefined);
        const t0 = performance.now();
        try {
            await fetchUntilFirstByte(url);
            const generationMs = Math.round(performance.now() - t0);
            const trimmed = formState?.text?.trim() ?? '';
            setSynthStats({
                generationMs,
                wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
                charCount: trimmed.length,
            });
            setUrl(url);
        } catch (error) {
            setState(RequestState.FAILED);
        }
        setState(RequestState.SUCCESS);
    };

    function handleStateChange(params: FormType): void {
        // compare formState with params
        if (JSON.stringify(params) !== JSON.stringify(formState)) {
            setFormState(params);
        }
    }

    return (
        <div className="studio-page min-h-screen text-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
            <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(80% 60% at 20% 10%, rgba(168,85,247,0.35), transparent 60%), radial-gradient(60% 50% at 90% 30%, rgba(56,189,248,0.25), transparent 60%)",
                }}
            />
            <div className="relative z-10 flex flex-col min-h-screen">
                <Nav />
                <main className="flex-1 px-4 md:px-10 pb-16">
                    <div className="max-w-3xl mx-auto pt-4 md:pt-8 mb-8 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/15 text-slate-200 mb-4">
                            Studio
                        </span>
                        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
                            Synthesize{" "}
                            <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                                speech in seconds.
                            </span>
                        </h1>
                        <p className="mt-3 text-sm md:text-base text-slate-300">
                            Pick a language and model, drop in some text, and hit Synthesize.
                        </p>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700 p-6 md:p-8 shadow-2xl">
                            <Form
                                player={state === RequestState.SUCCESS && <Player url={url} stats={synthStats} />}
                                isPending={state === RequestState.PENDING}
                                onFormChange={handleStateChange}
                                onSubmit={handleFormSubmit}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default IndexPage;
