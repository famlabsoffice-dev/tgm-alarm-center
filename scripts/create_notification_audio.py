from __future__ import annotations

import math
import wave
from pathlib import Path

SAMPLE_RATE = 44_100
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "notifications"


def write_wav(name: str, segments: list[tuple[float, float, float]]) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    frames: list[int] = []
    phase = 0.0
    for duration, start_frequency, end_frequency in segments:
        count = max(1, int(duration * SAMPLE_RATE))
        for index in range(count):
            progress = index / max(1, count - 1)
            frequency = start_frequency + (end_frequency - start_frequency) * progress
            phase += 2.0 * math.pi * frequency / SAMPLE_RATE
            attack = min(1.0, index / (SAMPLE_RATE * 0.012))
            release = min(1.0, (count - index) / (SAMPLE_RATE * 0.028))
            envelope = min(attack, release)
            frames.append(int(0.38 * envelope * math.sin(phase) * 32767))
    with wave.open(str(OUTPUT / name), "wb") as file:
        file.setnchannels(1)
        file.setsampwidth(2)
        file.setframerate(SAMPLE_RATE)
        file.writeframes(b"".join(sample.to_bytes(2, "little", signed=True) for sample in frames))


write_wav("alarm-pulse.wav", [(0.16, 880.0, 880.0), (0.08, 0.0, 0.0), (0.16, 880.0, 660.0)])
write_wav("alarm-siren.wav", [(0.48, 560.0, 940.0), (0.08, 0.0, 0.0), (0.48, 940.0, 560.0), (0.08, 0.0, 0.0), (0.48, 560.0, 940.0)])
write_wav("alarm-chime.wav", [(0.24, 523.25, 523.25), (0.06, 0.0, 0.0), (0.3, 659.25, 659.25), (0.06, 0.0, 0.0), (0.42, 783.99, 783.99)])
