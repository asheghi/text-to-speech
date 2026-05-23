import type { ModelType } from './fetchModelsList';

/**
 * Additional TTS models that are NOT in the k2-fsa/sherpa-onnx `tts-models`
 * GitHub release. These are pulled from third-party sources and may need
 * post-download conversion (see `convertPiperModel.ts`) before sherpa-onnx
 * can load them.
 */
export type CustomModel = ModelType & {
    /**
     * What kind of post-processing the bundle needs after extraction.
     * - 'none': already sherpa-onnx ready (just extract / drop files in).
     * - 'piper-raw': raw Piper bundle (`.onnx` + `.onnx.json` only). Needs ONNX
     *   metadata injection, tokens.txt generation, and an `espeak-ng-data` dir.
     */
    postProcess: 'none' | 'piper-raw';
    /**
     * Relative path inside the extracted archive where the actual model files
     * live. If the archive root already equals `modelName`, leave this empty.
     * For yeager bundles it's e.g. `sv_SE/sv_SE-axel-medium`.
     */
    innerPath?: string;
    /**
     * Defaults used when the bundle ships ONLY a `.onnx` file (no `.onnx.json`).
     * The converter will inject metadata using these values and copy
     * `tokens.txt` from any sibling Piper voice. All Piper voices for the same
     * language family share an identical phoneme_id_map, so token-sharing
     * across same-language voices is safe.
     */
    piperFallback?: {
        sampleRate: number;
        language: string;
        voice: string;
        numSpeakers: number;
    };
    /**
     * Alternative to the standard `url` (single tarball) download: a list of
     * raw files to drop directly into the model directory, no extraction.
     * Used for bundles like MMS-TTS that ship loose files on Hugging Face
     * instead of a tarball. When set, `url` is ignored.
     */
    rawFiles?: Array<{ url: string; destName: string }>;
    /**
     * Supplementary files to download into the model directory AFTER the main
     * archive extraction (or alongside rawFiles). Checked on every download —
     * any missing files are fetched even if the model directory already exists.
     * Used for Supertonic to pull unicode_indexer.json and voice style JSONs
     * from the official HuggingFace repo alongside the k2-fsa int8 bundle.
     */
    extraFiles?: Array<{ url: string; destName: string }>;
    /**
     * Pinned speaker id for multi-speaker models where the picker shouldn't
     * expose the full sid range. Example: Daniel ships a 16-speaker VITS but
     * only one sid is the actual cloned "Daniel" voice — pin that one.
     * Falls back to 0 (the existing hardcoded default) when undefined.
     */
    defaultSid?: number;
    /** Free-form license string surfaced in logs / future UI badges. */
    license?: string;
    /** Free-form notes shown in logs when the model is requested. */
    notes?: string;
    /**
     * If set, this entry doesn't have its own files — it shares the model
     * directory of `aliasOf` and just overrides `defaultLang`. Used to expose
     * multi-language bundles (like Supertonic with 31 languages) as N picker
     * entries that re-use one disk footprint and one in-memory TTS instance.
     */
    aliasOf?: string;
    /**
     * Language code (ISO 639-1) passed to Supertonic's native engine as the
     * `lang` argument. Defaults to 'sv' in tts.ts to preserve existing audio
     * cache.
     */
    defaultLang?: string;
    /**
     * TTS model family. Set on Supertonic source entries so the frontend can
     * detect which settings panel to show without name-sniffing.
     */
    family?: 'supertonic' | 'vits' | 'kitten';
};

const HF_SUPERTONIC = 'https://huggingface.co/Supertone/supertonic-3/resolve/main';

export const customModels: CustomModel[] = [
    {
        fileName: 'sv_SE-axel-medium.tar.gz',
        modelName: 'vits-piper-sv_SE-axel-medium',
        content_type: 'application/gzip',
        size: '58355585',
        created_at: '2026-03-25T00:00:00Z',
        updated_at: '2026-03-25T00:00:00Z',
        url: 'https://github.com/yeager/piper-voices-sv/releases/download/v1.2.0/sv_SE-axel-medium.tar.gz',
        postProcess: 'piper-raw',
        innerPath: 'sv_SE/sv_SE-axel-medium',
        license: 'CC-BY 4.0',
    },
    // Daniel (yeager v1.1.0) REMOVED 2026-05-23. The yeager release ships
    // only the .onnx file (no .onnx.json), and all 16 candidate speaker IDs
    // produced noise rather than speech — likely because the voice clone was
    // trained on a different phoneme set than alma/axel and our borrowed
    // tokens.txt is wrong. With no upstream JSON or working reference config
    // we can't recover the right tokens. Keeping the convertPiperRawToSherpa
    // path because future Piper voices with complete bundles will use it.

    {
        // MMS-TTS Swedish, pre-converted to sherpa-onnx layout by willwade
        // on Hugging Face. Single female voice, 16 kHz, character-level
        // tokens (no espeak phonemizer). Punctuation is dropped silently.
        fileName: 'mms-tts-swe',
        modelName: 'vits-mms-sv',
        content_type: 'application/octet-stream',
        size: '114016184',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        url: '', // unused; rawFiles below
        postProcess: 'none',
        rawFiles: [
            {
                url: 'https://huggingface.co/willwade/mms-tts-multilingual-models-onnx/resolve/main/swe/model.onnx',
                destName: 'model.onnx',
            },
            {
                url: 'https://huggingface.co/willwade/mms-tts-multilingual-models-onnx/resolve/main/swe/tokens.txt',
                destName: 'tokens.txt',
            },
        ],
        license: 'CC-BY-NC-4.0 (non-commercial only)',
        notes: 'MMS-TTS Swedish — Meta AI base, willwade ONNX conversion. 16 kHz (lower fidelity than 22.05 kHz Piper voices). NON-COMMERCIAL USE ONLY.',
    },
    {
        // Supertonic 3 multilingual: 31 languages, 44.1 kHz output.
        // Uses the native onnxruntime-node inference engine (NOT sherpa-onnx)
        // so totalStep, named voice styles (M1-F5), language, and speed are
        // all fully exposed as first-class parameters.
        //
        // The k2-fsa int8 bundle supplies the 4 ONNX files + tts.json.
        // The extraFiles supply the supplementary assets needed by the native
        // engine: unicode_indexer.json + 10 voice style JSON embeddings.
        //
        // This is the source entry (sv = Swedish). 30 language aliases follow,
        // sharing this download. Voice style is now a separate UI parameter —
        // no per-voice aliases needed.
        fileName: 'sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2',
        modelName: 'supertonic-3-sv-int8',
        content_type: 'application/x-bzip2',
        size: '128774318',
        created_at: '2026-05-11T00:00:00Z',
        updated_at: '2026-05-11T00:00:00Z',
        url: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2',
        postProcess: 'none',
        innerPath: 'sherpa-onnx-supertonic-3-tts-int8-2026-05-11',
        license: 'OpenRAIL-M (commercial use generally permitted with RAIL restrictions)',
        notes: 'Supertonic 3 Swedish — 44.1 kHz, ~128 MB, 10 named voices (M1-F5), 31 languages via aliases.',
        defaultLang: 'sv',
        family: 'supertonic',
        extraFiles: [
            // Unicode character→token-index mapping (needed by native engine).
            // The k2-fsa bundle ships unicode_indexer.bin (sherpa-onnx format);
            // the native engine needs the JSON version from the official HF repo.
            { url: `${HF_SUPERTONIC}/onnx/unicode_indexer.json`, destName: 'unicode_indexer.json' },
            // Voice style embeddings (M1–M5 male, F1–F5 female).
            { url: `${HF_SUPERTONIC}/voice_styles/M1.json`, destName: 'M1.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/M2.json`, destName: 'M2.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/M3.json`, destName: 'M3.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/M4.json`, destName: 'M4.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/M5.json`, destName: 'M5.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/F1.json`, destName: 'F1.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/F2.json`, destName: 'F2.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/F3.json`, destName: 'F3.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/F4.json`, destName: 'F4.json' },
            { url: `${HF_SUPERTONIC}/voice_styles/F5.json`, destName: 'F5.json' },
        ],
    },
    // Supertonic language aliases: 30 languages beyond Swedish from the same
    // bundle. Voice style is a separate UI parameter (no per-voice aliases).
    // Zero extra disk — same alias mechanism; only defaultLang differs.
    ...(
        ['en', 'ko', 'ja', 'ar', 'bg', 'cs', 'da', 'de', 'el', 'es',
         'et', 'fi', 'fr', 'hi', 'hr', 'hu', 'id', 'it', 'lt', 'lv',
         'nl', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'tr', 'uk', 'vi'
        ] as const
    ).map((lang) => ({
        fileName: '',
        modelName: `supertonic-3-${lang}-int8`,
        content_type: 'application/x-bzip2',
        size: '0',
        created_at: '2026-05-11T00:00:00Z',
        updated_at: '2026-05-11T00:00:00Z',
        url: '',
        postProcess: 'none' as const,
        license: 'OpenRAIL-M (commercial use generally permitted with RAIL restrictions)',
        notes: `Supertonic 3 (${lang}) — alias of supertonic-3-sv-int8, lang=${lang}. 10 voices (M1-F5) available.`,
        aliasOf: 'supertonic-3-sv-int8',
        defaultLang: lang,
        family: 'supertonic' as const,
    })),
];

export function findCustomModel(modelName: string): CustomModel | undefined {
    return customModels.find((m) => m.modelName === modelName);
}
