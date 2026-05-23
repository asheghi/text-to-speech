import { Link } from "react-router-dom";

const appName = (import.meta.env.VITE_APP_TITLE as string | undefined) ?? "Text To Speech";

type ParamRow = {
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: string;
    description: string;
};

const httpParams: ParamRow[] = [
    {
        name: "text",
        type: "string",
        required: true,
        description: "The sentence to synthesize. URL-encode it. The endpoint produces one WAV per call; long input should be split client-side.",
    },
    {
        name: "model",
        type: "string",
        required: true,
        description: "Model identifier (e.g. a Supertonic 3 language entry, a Piper/VITS model name, or a Kitten variant). Use the getModelsList tRPC query to enumerate.",
    },
    {
        name: "speed",
        type: "number",
        defaultValue: "1.0",
        description: "Playback rate multiplier. >1 speeds up, <1 slows down.",
    },
    {
        name: "steps",
        type: "integer (2–16)",
        defaultValue: "8",
        description: "Supertonic-only. Diffusion step count. Higher = better quality, slower. Ignored by VITS/Kitten/Piper.",
    },
    {
        name: "voiceStyle",
        type: "string",
        defaultValue: "M1",
        description: "Supertonic-only. One of M1–M5 (male) or F1–F5 (female) voice IDs. Ignored by other families.",
    },
];

const Nav = () => (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="px-6 md:px-10 py-4 flex items-center justify-between max-w-7xl mx-auto">
            <Link to="/" className="font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                <span className="inline-block w-7 h-7 rounded-md bg-gradient-to-br from-fuchsia-500 to-indigo-500" />
                {appName}
            </Link>
            <nav className="flex items-center gap-2 md:gap-6 text-sm">
                <Link to="/app" className="text-slate-600 hover:text-slate-900 transition-colors">App</Link>
                <Link to="/reader" className="text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline">Reader</Link>
                <Link to="/status" className="text-slate-600 hover:text-slate-900 transition-colors hidden sm:inline">Status</Link>
                <Link to="/docs" className="text-slate-900 font-medium">Docs</Link>
                <Link
                    to="/app"
                    className="ml-2 px-4 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                >
                    Open app
                </Link>
            </nav>
        </div>
    </header>
);

const sidebarSections: Array<{ id: string; label: string; sub?: Array<{ id: string; label: string }> }> = [
    { id: "overview", label: "Overview" },
    {
        id: "http-api",
        label: "HTTP API",
        sub: [
            { id: "http-get-tts-wav", label: "GET /api/tts.wav" },
            { id: "http-get-tts", label: "GET /api/tts" },
            { id: "http-put-tts", label: "PUT /api/tts" },
            { id: "http-params", label: "Parameters" },
            { id: "http-example", label: "Example" },
        ],
    },
    {
        id: "trpc-api",
        label: "tRPC API",
        sub: [
            { id: "trpc-get-models-list", label: "getModelsList" },
            { id: "trpc-get-storage-status", label: "getStorageStatus" },
            { id: "trpc-share-content", label: "shareContent" },
            { id: "trpc-get-shared-content", label: "getSharedContent" },
        ],
    },
];

const Code = ({ children, language }: { children: string; language?: string }) => (
    <div className="rounded-lg bg-slate-950 text-slate-100 ring-1 ring-slate-900/10 overflow-hidden">
        {language && (
            <div className="px-4 py-2 text-xs text-slate-400 border-b border-white/5 font-mono">{language}</div>
        )}
        <pre className="px-4 py-4 text-xs md:text-sm leading-relaxed overflow-x-auto whitespace-pre font-mono">{children}</pre>
    </div>
);

const Tag = ({ tone, children }: { tone: "get" | "put" | "query" | "mutation"; children: React.ReactNode }) => {
    const colors: Record<string, string> = {
        get: "bg-emerald-100 text-emerald-700 ring-emerald-200",
        put: "bg-amber-100 text-amber-800 ring-amber-200",
        query: "bg-sky-100 text-sky-700 ring-sky-200",
        mutation: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ring-1 ${colors[tone]}`}>
            {children}
        </span>
    );
};

const SectionHeading = ({ id, children, eyebrow }: { id: string; children: React.ReactNode; eyebrow?: string }) => (
    <div id={id} className="scroll-mt-24">
        {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">{eyebrow}</div>
        )}
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">{children}</h2>
    </div>
);

const SubHeading = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <h3 id={id} className="scroll-mt-24 text-lg md:text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
        {children}
    </h3>
);

export const DocsPage = (): JSX.Element => {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            <Nav />
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-12 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
                {/* Sidebar */}
                <aside className="lg:sticky lg:top-20 self-start hidden lg:block">
                    <nav className="text-sm space-y-4">
                        {sidebarSections.map((s) => (
                            <div key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    className="block font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                                >
                                    {s.label}
                                </a>
                                {s.sub && (
                                    <ul className="mt-2 space-y-1.5 pl-3 border-l border-slate-200">
                                        {s.sub.map((sub) => (
                                            <li key={sub.id}>
                                                <a
                                                    href={`#${sub.id}`}
                                                    className="block text-slate-600 hover:text-indigo-600 transition-colors"
                                                >
                                                    {sub.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <article className="min-w-0 space-y-16 pb-24">
                    {/* Overview */}
                    <section className="space-y-5">
                        <SectionHeading id="overview" eyebrow="Reference">
                            API Documentation
                        </SectionHeading>
                        <p className="text-slate-600 leading-relaxed max-w-3xl">
                            {appName} exposes two surfaces. The <strong>HTTP API</strong> streams synthesized WAV audio
                            from a single request — perfect for shell scripts, CDN-cached embeds, and audio pipelines.
                            The <strong>tRPC API</strong> at <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-sm">/api/trpc</code> is
                            used by the bundled UI to enumerate models, check storage, and share content between
                            sessions.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
                            <div className="rounded-lg border border-slate-200 p-4">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Base URL</div>
                                <div className="font-mono text-sm text-slate-900">http://localhost:8080</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4">
                                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Auth</div>
                                <div className="text-sm text-slate-700">None — designed for trusted networks.</div>
                            </div>
                        </div>
                    </section>

                    {/* HTTP API */}
                    <section className="space-y-8">
                        <SectionHeading id="http-api" eyebrow="HTTP">
                            HTTP API
                        </SectionHeading>
                        <p className="text-slate-600 leading-relaxed max-w-3xl">
                            All three HTTP endpoints share the same query-parameter contract and synthesize a single
                            sentence per request. <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">GET</code> calls
                            stream WAV bytes; <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">PUT</code> warms
                            the server-side cache and returns 200 with no body.
                        </p>

                        {/* GET /api/tts.wav */}
                        <div className="space-y-3">
                            <SubHeading id="http-get-tts-wav">
                                <Tag tone="get">GET</Tag>
                                <code className="font-mono text-base">/api/tts.wav</code>
                            </SubHeading>
                            <p className="text-slate-600 max-w-3xl">
                                Returns a <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">audio/wav</code> stream
                                of the synthesized sentence. Use the <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">.wav</code> suffix
                                when you want the file extension to be obvious to clients (browsers, players).
                            </p>
                        </div>

                        {/* GET /api/tts */}
                        <div className="space-y-3">
                            <SubHeading id="http-get-tts">
                                <Tag tone="get">GET</Tag>
                                <code className="font-mono text-base">/api/tts</code>
                            </SubHeading>
                            <p className="text-slate-600 max-w-3xl">
                                Identical to <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">/api/tts.wav</code> but
                                without the suffix. Same response, same content type.
                            </p>
                        </div>

                        {/* PUT /api/tts */}
                        <div className="space-y-3">
                            <SubHeading id="http-put-tts">
                                <Tag tone="put">PUT</Tag>
                                <code className="font-mono text-base">/api/tts</code>
                            </SubHeading>
                            <p className="text-slate-600 max-w-3xl">
                                Triggers generation and primes the server-side cache, then returns
                                <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm mx-1">200 OK</code> with an empty body.
                                Used by the reader UI to preload upcoming sentences so playback never stalls.
                            </p>
                        </div>

                        {/* Parameters table */}
                        <div className="space-y-3">
                            <SubHeading id="http-params">Parameters</SubHeading>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="text-left font-semibold px-4 py-2.5">Name</th>
                                            <th className="text-left font-semibold px-4 py-2.5">Type</th>
                                            <th className="text-left font-semibold px-4 py-2.5">Default</th>
                                            <th className="text-left font-semibold px-4 py-2.5">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {httpParams.map((p) => (
                                            <tr key={p.name} className="align-top">
                                                <td className="px-4 py-3 font-mono text-slate-900 whitespace-nowrap">
                                                    {p.name}
                                                    {p.required && (
                                                        <span className="ml-1.5 text-xs text-rose-600 font-sans font-medium">required</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-mono text-xs">{p.type}</td>
                                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                                                    {p.defaultValue ?? "—"}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{p.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Example */}
                        <div className="space-y-3">
                            <SubHeading id="http-example">Example</SubHeading>
                            <Code language="bash">
{`curl -G 'http://localhost:8080/api/tts.wav' \\
  --data-urlencode 'text=Hello from your self-hosted TTS.' \\
  --data-urlencode 'model=supertonic-3-en' \\
  --data-urlencode 'voiceStyle=F1' \\
  --data-urlencode 'speed=1.0' \\
  --data-urlencode 'steps=8' \\
  --output hello.wav`}
                            </Code>
                        </div>
                    </section>

                    {/* tRPC API */}
                    <section className="space-y-8">
                        <SectionHeading id="trpc-api" eyebrow="tRPC">
                            tRPC API
                        </SectionHeading>
                        <p className="text-slate-600 leading-relaxed max-w-3xl">
                            Mounted at <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">/api/trpc</code>. Procedures
                            are namespaced under <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">tts.*</code>. The
                            bundled React client (see <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm">src/TrpcWrapper.tsx</code>) shares
                            types directly with the server.
                        </p>

                        {/* getModelsList */}
                        <div className="space-y-3">
                            <SubHeading id="trpc-get-models-list">
                                <Tag tone="query">Query</Tag>
                                <code className="font-mono text-base">tts.getModelsList</code>
                            </SubHeading>
                            <p className="text-slate-600 max-w-3xl">
                                Returns the merged model list: upstream sherpa-onnx releases, third-party custom models,
                                and language aliases (e.g. the 31 Supertonic language entries).
                            </p>
                            <Code language="ts">
{`// Input: none
// Output: ModelType[]
type ModelType = {
  name: string;
  family: 'supertonic' | 'kitten' | 'vits';
  defaultLang?: string;
  // ...source-specific fields
}`}
                            </Code>
                        </div>

                        {/* getStorageStatus */}
                        <div className="space-y-3">
                            <SubHeading id="trpc-get-storage-status">
                                <Tag tone="query">Query</Tag>
                                <code className="font-mono text-base">tts.getStorageStatus</code>
                            </SubHeading>
                            <p className="text-slate-600 max-w-3xl">
                                Returns disk usage stats for the local model + audio caches under
                                <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm mx-1">data/</code>. Used by the Status page.
                            </p>
                            <Code language="ts">
{`// Input: none
// Output: storage stats for data/ directories`}
                            </Code>
                        </div>

                        {/* shareContent */}
                        <div className="space-y-3">
                            <SubHeading id="trpc-share-content">
                                <Tag tone="mutation">Mutation</Tag>
                                <code className="font-mono text-base">tts.shareContent</code>
                            </SubHeading>
                            <p className="text-slate-600 max-w-3xl">
                                Persists the supplied content plus playback settings under
                                <code className="px-1.5 py-0.5 rounded bg-slate-100 text-sm mx-1">data/shared/&lt;nanoid&gt;.json</code> and
                                returns the share ID. Used by the app to hand off a session into the reader.
                            </p>
                            <Code language="ts">
{`// Input
{
  content: string,            // required, min length 1
  title?: string,
  language?: string,
  model?: string,
  speed?: number,
  steps?: number,
  voiceStyle?: string,
}

// Output
{ shareId: string }            // 10-character nanoid`}
                            </Code>
                        </div>

                        {/* getSharedContent */}
                        <div className="space-y-3">
                            <SubHeading id="trpc-get-shared-content">
                                <Tag tone="query">Query</Tag>
                                <code className="font-mono text-base">tts.getSharedContent</code>
                            </SubHeading>
                            <p className="text-slate-600 max-w-3xl">
                                Looks up a previously shared session by ID. Throws if the share has expired or never existed.
                            </p>
                            <Code language="ts">
{`// Input
{ shareId: string }

// Output
{
  content: string,
  title: string,
  language?: string,
  model?: string,
  speed?: number,
  steps?: number,
  voiceStyle?: string,
  createdAt: string,           // ISO timestamp
}`}
                            </Code>
                        </div>
                    </section>

                    {/* Footer CTA */}
                    <section className="pt-8 border-t border-slate-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Ready to try it?</h3>
                                <p className="text-slate-600 text-sm">Open the app and synthesize your first sentence in one click.</p>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    to="/app"
                                    className="px-5 py-2.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Open app
                                </Link>
                                <Link
                                    to="/"
                                    className="px-5 py-2.5 rounded-md border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Back to home
                                </Link>
                            </div>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
};

export default DocsPage;
