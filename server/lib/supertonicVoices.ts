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

export const SUPERTONIC_EXPRESSION_TAGS = [
    { tag: '<laugh>',       label: 'Laugh'        },
    { tag: '<breath>',      label: 'Breath'       },
    { tag: '<surprise>',    label: 'Surprise'     },
    { tag: '<sigh>',        label: 'Sigh'         },
    { tag: '<scream>',      label: 'Scream'       },
    { tag: '<throatclear>', label: 'Clear throat' },
    { tag: '<sad>',         label: 'Sad'          },
    { tag: '<angry>',       label: 'Angry'        },
    { tag: '<cough>',       label: 'Cough'        },
    { tag: '<yawn>',        label: 'Yawn'         },
] as const;

export const DEFAULT_VOICE_STYLE: VoiceStyleId = 'M1';
export const DEFAULT_STEPS = 8;
export const MIN_STEPS = 2;
export const MAX_STEPS = 16;
