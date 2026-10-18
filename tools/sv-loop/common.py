# Shared helpers for the Supertonic Swedish TTS -> STT tools.
import io, os, re, subprocess, time
import requests, soundfile as sf, librosa, torch
from transformers import pipeline
from num2words import num2words

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL = "supertonic-3-sv-int8"


class Server:
    """A local copy of the real server, with caching off and no rate limit."""
    def __init__(self, port, log_path):
        self.port, self.log_path, self.proc = port, log_path, None

    def restart(self):
        if self.proc:
            self.proc.terminate(); self.proc.wait()
        env = dict(os.environ, PORT=str(self.port), RATE_LIMIT_MAX="100000000", NO_AUDIO_CACHE="true",
                   LD_LIBRARY_PATH=f"{REPO}/node_modules/sherpa-onnx-linux-x64")
        self.proc = subprocess.Popen(["bun", "server/index.ts"], cwd=REPO, env=env,
                                     stdout=open(self.log_path, "a"), stderr=subprocess.STDOUT)
        for _ in range(120):
            try:
                requests.get(f"http://localhost:{self.port}/api/tts.wav", timeout=2); return
            except Exception:
                time.sleep(1)
        raise RuntimeError("server did not start")

    def stop(self):
        if self.proc: self.proc.terminate()


_asr = None
def asr():
    global _asr
    if _asr is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _asr = pipeline("automatic-speech-recognition", model="KBLab/kb-whisper-medium", device=device,
                        # fp32 even on CUDA: fp16 runs ended in NVIDIA driver faults
                        # ("unspecified launch failure") on the laptop's RTX 5070 Ti.
                        torch_dtype=torch.float32,
                        generate_kwargs={"language": "sv", "task": "transcribe"})
    return _asr


# Mirror normalizeSwedish's abbreviation expansion so references match what is spoken.
ABBR = [(r"\bt\.\s?ex\.", "till exempel"), (r"\bbl\.\s?a\.", "bland annat"), (r"\bosv\.", "och så vidare"),
        (r"\bd\.?\s?v\.?\s?s\.?", "det vill säga"), (r"\bfr\.\s?o\.\s?m\.", "från och med"),
        (r"\bt\.\s?o\.\s?m\.", "till och med"), (r"\bca\b\.?", "cirka"), (r"\bp\.\s?g\.\s?a\.", "på grund av"),
        (r"\bm\.\s?fl\.", "med flera"), (r"\bnr\b\.?", "nummer")]


def norm(s):
    for pat, rep in ABBR:
        s = re.sub(pat, rep, s, flags=re.I)
    s = re.sub(r"\d+", lambda m: " " + num2words(int(m.group()), lang="sv") + " ", s.lower())
    return re.sub(r"[^\wåäöéü ]", " ", s).split()


def tts_stt(port, text, voice):
    r = requests.get(f"http://localhost:{port}/api/tts.wav", timeout=300,
                     params={"text": text, "model": MODEL, "voiceStyle": voice, "steps": 8})
    r.raise_for_status()
    a, sr = sf.read(io.BytesIO(r.content), dtype="float32")
    return asr()(librosa.resample(a, orig_sr=sr, target_sr=16000))["text"].strip()


def missed_words(ref, hyp):
    h = norm(hyp); hj = "".join(h)
    return [w for w in norm(ref) if w not in h and w not in hj]


def heard(word, hyp):
    h = norm(hyp)
    return word in h or word in "".join(h)
