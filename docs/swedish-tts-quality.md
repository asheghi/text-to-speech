# Swedish TTS quality

This doc records how the app's Swedish output is measured and improved, and what has been found.

## Models (2026-10)
- **Supertonic 3 (`supertonic-3-sv-int8`)** is the default for Swedish. It is the most natural option we can run on CPU (about 6 s per sentence on the VPS). It reads raw characters, with no phonemizer, so it guesses pronunciation from spelling.
- **Piper/VITS Swedish voices** (alma, lisa, nst, axel) are fast (about 160 ms) and use espeak-ng phonemes, so pronunciation is rule-correct, but they sound more robotic.
- **Rejected:**
  - Chatterbox Multilingual: 81 s per sentence on CPU.
  - OmniVoice: 40–99 s per sentence on CPU, and its word-miss rate is no better.
  - VoxCPM2: too large for CPU.
  - MMS: 16 kHz, non-commercial licence.
  - Fine-tuning: dropped (Supertonic has no training code).

## Model precision and steps (2026-10-18)
Predicted naturalness (UTMOS22 strong; trained on English, so read it as relative), on the 44 regression sentences × F1/M1, with local CPU timings:

| Variant | UTMOS | ms/sentence |
|---|---|---|
| int8, 8 steps (was live) | 3.98 ± 0.03 | 3,877 |
| int8, 12 steps | 3.99 | 4,822 |
| int8, 16 steps | 4.01 | 5,837 |
| **fp32, 8 steps (now live)** | **4.11 ± 0.02** | **3,808** |
| fp32, 12 steps | 4.13 | 4,737 |

fp32 is clearly better at no CPU cost, so the server now downloads the official full-precision vector estimator and vocoder as `extraFiles` (+357 MB), and the engine prefers them. Steps add little, so the default stays at 8.

Tools:
- `tools/sv-loop/synth.ts` synthesises with a given model directory.
- `tools/sv-loop/mos.py` scores directories of wavs.

### Voices (fp32, 8 steps, 44 sentences each)
UTMOS: F3 4.24 · F1 4.18 · M4 4.12 · F5 4.08 · M1 4.03 (default) · F2 4.00 · M5 3.97 · F4 3.97 · M2 3.87 · M3 3.77 (±0.02–0.04).

F3 and F1 score highest; M4 is the best male voice. The default (M1) is unchanged: choosing the default voice is a product decision, and UTMOS was trained on English, so a listening check comes first.

## Text pipeline (Swedish only, `server/lib/tts.ts` → `resolveSentence`)
1. **`normalizeSwedish`** ([server/lib/normalizeSwedish.ts](../server/lib/normalizeSwedish.ts)) writes out numbers, decimal commas, years, HH:MM times, `kl`, dates (`2024-05-03`, `3 maj` → tredje maj), written ordinals (`3:e`, `21:a`), gender agreement for 1 (`1 bok` → en bok, `1 barn` → ett barn, using a list of common ett-nouns, compound last parts and -eri/-ment/-um/-ande suffixes; `1 kr` → en krona), kr, %, units and common abbreviations (t.ex., bl.a., dvs., ca …). Tests are in `normalizeSwedish.test.ts`. It applies to all Swedish models.
2. **`respellSwedishForSupertonic`** ([server/lib/swedishRespell.ts](../server/lib/swedishRespell.ts)) applies to Supertonic only:
   - **Patterns:**
     - `stj` → `sj` (stjärna). Supertonic pronounced the t.
     - vowel + `gn` → `ngn` (regn, vagn, lugn, ugn, lögn).
   - **Stem entries** (with inflections):
     - Hard-k exceptions: kille, killar, kebab, kiwi, kex.
     - Loanwords with a sj-sound: ingenjör, journalist, genre, gest, lasagne.
     - Loanword spellings: yoghurt → jogurt, eksem → exem. Compound boundary: förser → för-ser.
     - Final rg as a j-sound: korg, färg, torg. As a general rule, rg→rj made sorg (4→2 of 4 voices) and talg worse, so it is per-word only.
   - **`swedishRespell.auto.json`:** exact-word entries found by the automated loop.

## Closed TTS → STT loop
How it works:
- Synthesise text through the real server pipeline.
- Transcribe it with `KBLab/kb-whisper-medium`.
- Treat a word as correct when the recogniser hears it.
- For each missed word, check that it fails consistently when spoken alone, on 2 voices. Then try rule-based respellings, and accept one only if it passes on both voices and also in the original sentence.

Patterns that hold across a word family are promoted from the auto list into hand-written rules after a 4-voice check.

Corpus: about 4,200 everyday sentences from Swedish Wikipedia, with no digits or proper nouns.

| Measurement | Word-miss rate |
|---|---|
| 40 hand-written test sentences, before respelling | 4.7% |
| same, after stem entries | 2.7% |
| Wikipedia rounds (60 sentences each) | 1.7–2.5% |
| Wikipedia sentences 300–359: 2.41% before → **1.37%** after fp32 + stj/gn/korg rules (same text) | |
| `regress.py`: 44 sentences × 4 voices, with stj/gn patterns, digit-aware scoring (2026-10-17) | 0.88% (8/912) |
| full corpus pass (4,185 sentences, 70 rounds, 2026-10-18) | 2.0% average; flat from first to last round |
| `regress.py` after the full pass, on Eagle (ROCm) | 1.21% (11/912): none of the misses touch changed words, so this is run-to-run and GPU-backend variance |

**The loop has converged.** The full corpus pass accepted only 4 words (potatis-sorter, kommun-typ, aurikularis, plus earlier ones), and the miss rate did not fall over the run. Nearly every remaining miss is a rare compound, a Latin or English term, or a one-off. More rounds will not move the number; what is left is pitch accent and stress, which ASR cannot measure.

One family fix came out of the misses: `färg` → `färj` now covers every word starting with färg (färgat 1→4/4, färgade 2→4/4, färgblindhet 3→4/4).

Much of what remains is recogniser noise: words written as digits, inconsistent one-off misses.

Still unsolved: regi, geni, deg, norr/norrut, barr, taggiga, symtom, jäst compounds. These sit at 0/4 with every respelling, which points to recogniser blind spots in the carrier sentence rather than Supertonic errors. jeans and regeln improved only to 2/4. keps was ASR noise (the original now passes 4/4). These need a native-speaker check.

The most frequent remaining regression miss, `ute` in "Det regnar ute idag", passes 4/4 when spoken alone. The recogniser hears "ut idag" in context: that is coarticulation, not a spelling problem, so it is left alone.

**Running it** (needs a venv with CUDA torch, transformers, librosa, soundfile, num2words and requests):
```
python -I tools/sv-loop/corpus.py ~/.cache/tts-spike/loop/corpus.txt
HF_HOME=~/.cache/tts-spike/hf python -I tools/sv-loop/loop.py ~/.cache/tts-spike/loop ~/.cache/tts-spike/loop/corpus.txt 60
```
Testing a candidate rule on 4 voices: `python -I tools/sv-loop/ruletest.py '<regex>' '<replacement>' word1,word2`.

Regression check (44 fixed sentences on 4 voices): `python -I tools/sv-loop/regress.py`. Run it after any rule change.

The laptop's RTX 5070 Ti hit NVIDIA driver faults (`unspecified launch failure`, NVRM errors in the kernel log) under sustained ASR load. It happened with two processes and again with one, and each time CUDA stayed unavailable until reboot. The tools now run ASR in fp32 rather than fp16, which is the next thing to try. fp32 did not help: CUDA failed again minutes after a fresh reboot. The full pass was therefore run on **Eagle** (Radeon RX 7900 XTX, PyTorch ROCm 6.4 wheel, `~/.cache/tts-spike/rocm` venv) at about 2 minutes per 60-sentence round, with no faults. The tools fall back to CPU (`CUDA_VISIBLE_DEVICES=""`).

Keep the work directory off `/tmp`: it is RAM-backed on the dev laptop, and a reboot wipes the loop state.

**Limits:**
- ASR success shows that the right words come through. It says nothing about stress, pitch accent (accent 1/2) or intonation.
- The recogniser can guess correct words from context, so some errors slip through.
