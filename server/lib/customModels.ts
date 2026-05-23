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
     * directory of `aliasOf` and just overrides `defaultSid` and/or
     * `defaultLang`. Used to expose multi-voice / multilingual bundles
     * (like Supertonic with 10 voice styles × 31 languages) as N picker
     * entries that re-use one disk footprint and one in-memory TTS instance.
     */
    aliasOf?: string;
    /**
     * Language code (ISO 639-1) passed as `extra.lang` to Supertonic's
     * GenerationConfig. Only Supertonic actually reads this — for VITS it's
     * carried in the cache key but has no effect on generation. Defaults to
     * 'sv' in tts.ts to preserve existing audio cache.
     */
    defaultLang?: string;
};

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
        // Supertonic 3 multilingual: 31 languages including Swedish, 44.1 kHz
        // output (~2× Piper, ~2.75× MMS). Uses a different model family than
        // VITS — 4 separate ONNX files + tts.json + unicode_indexer + voice
        // styles. Generation uses sherpa_onnx.GenerationConfig with
        // extra.lang='sv'. See tts.ts detectFamily/createSupertonicTTS.
        //
        // This is the source entry (sid=0). 9 voice-style aliases follow,
        // sharing this download and just overriding defaultSid.
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
        notes: 'Supertonic 3 — voice 0 of 10 (the default voice.bin style). 44.1 kHz, ~123 MB shared with v1-v9 and 30 other language aliases.',
        defaultSid: 0,
        defaultLang: 'sv',
    },
    // Supertonic voice aliases: 9 additional Swedish voices from the same
    // bundle, selected by sid at generation time. Zero extra disk — they all
    // share the supertonic-3-sv-int8 model directory and OfflineTts instance.
    ...Array.from({ length: 9 }, (_, i) => {
        const sid = i + 1;
        return {
            fileName: '',
            modelName: `supertonic-3-sv-int8-v${sid}`,
            content_type: 'application/x-bzip2',
            size: '0',
            created_at: '2026-05-11T00:00:00Z',
            updated_at: '2026-05-11T00:00:00Z',
            url: '',
            postProcess: 'none' as const,
            license: 'OpenRAIL-M (commercial use generally permitted with RAIL restrictions)',
            notes: `Supertonic 3 Swedish — voice ${sid} of 10 (alias of supertonic-3-sv-int8 with sid=${sid}).`,
            aliasOf: 'supertonic-3-sv-int8',
            defaultSid: sid,
            defaultLang: 'sv',
        };
    }),
    // Supertonic supports 30 more languages beyond Swedish from the SAME
    // bundle; each shows up here as one picker entry (sid=0 default voice).
    // Zero extra disk — same alias mechanism as the voice variants. If a
    // particular language needs voice variants later, add them with the same
    // `aliasOf + defaultSid + defaultLang` triple. Codes match the Supertonic
    // 3 README's "Language Support" table and the frontend's languageList ISO
    // 639-1 codes — so they slot into the existing language dropdown without
    // any frontend change.
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
        notes: `Supertonic 3 (${lang}) — voice 0 of 10. Alias of supertonic-3-sv-int8, lang=${lang}.`,
        aliasOf: 'supertonic-3-sv-int8',
        defaultSid: 0,
        defaultLang: lang,
    })),
];

export function findCustomModel(modelName: string): CustomModel | undefined {
    return customModels.find((m) => m.modelName === modelName);
}
