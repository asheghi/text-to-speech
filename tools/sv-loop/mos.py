# Mean predicted naturalness (UTMOS22 strong, 1-5) of every .wav in each given dir.
# UTMOS was trained on English, so treat it as a relative score between variants.
#   python -I tools/sv-loop/mos.py dir1 dir2 ...
import glob, sys, statistics, torch, librosa
m = torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True)
for d in sys.argv[1:]:
    scores = []
    for f in sorted(glob.glob(f"{d}/*.wav")):
        w, _ = librosa.load(f, sr=16000)
        with torch.no_grad():
            scores.append(m(torch.from_numpy(w).unsqueeze(0), 16000).item())
    print(f"{d}: MOS {statistics.mean(scores):.3f} ± {statistics.stdev(scores) / len(scores) ** .5:.3f} (n={len(scores)})", flush=True)
