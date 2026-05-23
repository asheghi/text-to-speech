/**
 * Supertonic 3 voice style constants.
 * Shared between server (inference) and frontend (UI).
 * Importable from frontend via '#/lib/supertonicVoices' (Vite alias).
 */

export const SUPERTONIC_VOICES = [
    { id: 'M1', name: 'Alex',    gender: 'Male'   },
    { id: 'M2', name: 'James',   gender: 'Male'   },
    { id: 'M3', name: 'Robert',  gender: 'Male'   },
    { id: 'M4', name: 'Sam',     gender: 'Male'   },
    { id: 'M5', name: 'Daniel',  gender: 'Male'   },
    { id: 'F1', name: 'Sarah',   gender: 'Female' },
    { id: 'F2', name: 'Lily',    gender: 'Female' },
    { id: 'F3', name: 'Jessica', gender: 'Female' },
    { id: 'F4', name: 'Olivia',  gender: 'Female' },
    { id: 'F5', name: 'Emily',   gender: 'Female' },
] as const;

export type VoiceStyleId = typeof SUPERTONIC_VOICES[number]['id'];

export const SUPERTONIC_VOICE_IDS = SUPERTONIC_VOICES.map(v => v.id) as VoiceStyleId[];

export const DEFAULT_VOICE_STYLE: VoiceStyleId = 'M1';
export const DEFAULT_STEPS = 8;
export const MIN_STEPS = 2;
export const MAX_STEPS = 16;
