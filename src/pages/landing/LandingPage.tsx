import { Link } from "react-router-dom";
import { APP_NAME, Wordmark, LogoMark } from "../../components/Brand/Brand";

const features = [
    {
        title: "Voices in 30+ languages",
        body: "A growing roster of natural-sounding male and female voices. Mix and match per request, fine-tune with a few sliders.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
        ),
    },
    {
        title: "Supertonic 3 neural TTS",
        body: "Built-in support for Supertonic 3 alongside Piper, VITS and Kitten. Trade quality for latency with a step slider.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 9 8.25l4.5 4.5 6.75-6.75M14.25 6h6v6" />
            </svg>
        ),
    },
    {
        title: "Simple REST API",
        body: "A single GET request returns a WAV stream. No SDK, no auth dance — just curl it and pipe it anywhere.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
        ),
    },
    {
        title: "Self-hostable via Docker",
        body: "Ship the included image, mount a volume at /data, done. Your text never leaves your network.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
        ),
    },
];

const curlExample = `curl -G 'http://localhost:8080/api/tts.wav' \\
  --data-urlencode 'text=Hello from your self-hosted TTS.' \\
  --data-urlencode 'model=supertonic-3-en' \\
  --data-urlencode 'voiceStyle=F1' \\
  --data-urlencode 'speed=1.0' \\
  --data-urlencode 'steps=8' \\
  --output hello.wav`;

const Nav = () => (
    <nav className="w-full px-6 md:px-10 py-5 flex items-center justify-between">
        <Wordmark tone="light" />
        <div className="flex items-center gap-2 md:gap-6 text-sm">
            <Link to="/studio" className="text-slate-300 hover:text-white transition-colors hidden sm:inline">Studio</Link>
            <Link to="/docs" className="text-slate-300 hover:text-white transition-colors">Docs</Link>
            <Link
                to="/studio"
                className="ml-2 px-4 py-2 rounded-md bg-white text-slate-900 font-medium hover:bg-slate-100 transition-colors"
            >
                Open Studio
            </Link>
        </div>
    </nav>
);

export const LandingPage = (): JSX.Element => {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Hero */}
            <header className="relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background:
                            "radial-gradient(80% 60% at 20% 10%, rgba(168,85,247,0.35), transparent 60%), radial-gradient(60% 50% at 90% 30%, rgba(56,189,248,0.25), transparent 60%)",
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.08] pointer-events-none"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                    }}
                />
                <div className="relative z-10">
                    <Nav />
                    <div className="px-6 md:px-10 pt-12 pb-24 md:pt-20 md:pb-32 max-w-5xl mx-auto text-center">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/15 text-slate-200 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Open-source · Self-hostable · Multi-engine
                        </span>
                        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
                            {APP_NAME}
                        </h1>
                        <p className="mt-5 text-2xl md:text-4xl font-semibold tracking-tight leading-tight">
                            Give your text{" "}
                            <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                                a voice.
                            </span>
                        </p>
                        <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-slate-300 leading-relaxed">
                            {APP_NAME} turns any text into natural-sounding speech with neural voices in 30+ languages.
                            Stream WAV over HTTP, run it in Docker, keep your data on your hardware.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                to="/studio"
                                className="px-6 py-3 rounded-md bg-white text-slate-900 font-medium hover:bg-slate-100 transition-colors w-full sm:w-auto"
                            >
                                Open Studio
                            </Link>
                            <Link
                                to="/docs"
                                className="px-6 py-3 rounded-md bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition-colors w-full sm:w-auto"
                            >
                                Read the docs
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features */}
            <section className="px-6 md:px-10 py-20 md:py-28 max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 mb-3">
                        Features
                    </span>
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Built for builders</h2>
                    <p className="mt-4 text-slate-600">
                        Everything you need to add high-quality speech to your product, with none of the SaaS lock-in.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 hover:border-indigo-200 transition-all"
                        >
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                                {f.icon}
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quick start */}
            <section className="px-6 md:px-10 py-20 md:py-24 bg-slate-50 border-y border-slate-200">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 mb-3">
                            Quick start
                        </span>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                            One curl call to a WAV file
                        </h2>
                        <p className="mt-4 text-slate-600 leading-relaxed">
                            The HTTP API exposes a single endpoint that streams a WAV. Pick a model, pass your text,
                            pipe the output anywhere — terminals, browsers, audio pipelines.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <Link
                                to="/docs"
                                className="px-5 py-2.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                            >
                                Full API reference
                            </Link>
                            <Link
                                to="/studio"
                                className="px-5 py-2.5 rounded-md border border-slate-300 text-slate-700 font-medium hover:bg-white transition-colors"
                            >
                                Open Studio
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-xl bg-slate-950 text-slate-100 p-5 md:p-6 shadow-xl ring-1 ring-slate-900/10">
                        <div className="flex items-center gap-1.5 mb-4">
                            <span className="w-3 h-3 rounded-full bg-red-500/70" />
                            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                            <span className="w-3 h-3 rounded-full bg-green-500/70" />
                            <span className="ml-3 text-xs text-slate-400">terminal</span>
                        </div>
                        <pre className="text-xs md:text-sm leading-relaxed overflow-x-auto whitespace-pre font-mono">
{curlExample}
                        </pre>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 md:px-10 py-12 bg-white">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5 text-slate-700 font-semibold">
                        <LogoMark size={24} />
                        {APP_NAME}
                    </div>
                    <nav className="flex items-center gap-6 text-sm text-slate-600">
                        <Link to="/studio" className="hover:text-slate-900 transition-colors">Studio</Link>
                        <Link to="/docs" className="hover:text-slate-900 transition-colors">Docs</Link>
                        <Link to="/status" className="hover:text-slate-900 transition-colors">Status</Link>
                    </nav>
                    <div className="text-xs text-slate-500">
                        Self-hosted. Open source. Yours.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
