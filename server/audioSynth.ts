import { Request, Response } from 'express';
import { getTrackById } from './catalog';
import { Track } from './types';

const SAMPLE_RATE = 22050;
const CHANNELS = 2;
const BITS_PER_SAMPLE = 16;
const BYTES_PER_SAMPLE = (BITS_PER_SAMPLE / 8) * CHANNELS;
const WAV_HEADER_SIZE = 44;

const SCALE_INTERVALS: Record<Track['scale'], number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
  pentatonic: [0, 2, 4, 7, 9, 12, 14, 16],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  raga: [0, 1, 4, 5, 7, 8, 11, 12],
  lofi7: [0, 3, 5, 7, 10, 12, 14, 15],
};

const CHORD_PROGRESSIONS: number[][] = [
  [0, 3, 4, 2],
  [0, 5, 3, 4],
  [0, 2, 5, 3],
  [3, 4, 0, 5],
];

function semiToHz(rootHz: number, semis: number): number {
  return rootHz * Math.pow(2, semis / 12);
}

function buildWavHeader(dataBytes: number): Buffer {
  const buf = Buffer.alloc(WAV_HEADER_SIZE);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM format
  buf.writeUInt16LE(CHANNELS, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * BYTES_PER_SAMPLE, 28);
  buf.writeUInt16LE(BYTES_PER_SAMPLE, 32);
  buf.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);
  return buf;
}

function synthesizeSample(track: Track, sampleIndex: number, totalSamples: number): [number, number] {
  const t = sampleIndex / SAMPLE_RATE;
  const beatsPerSec = track.bpm / 60;
  const beatFloat = t * beatsPerSec;
  const beatIndex = Math.floor(beatFloat);
  const beatPos = beatFloat - beatIndex;
  const barIndex = Math.floor(beatIndex / 4);
  const stepIndex = Math.floor(beatFloat * 2); // eighth notes
  const stepPos = beatFloat * 2 - stepIndex;

  const scale = SCALE_INTERVALS[track.scale] || SCALE_INTERVALS.minor;
  const progIdx = Math.abs(track.id.charCodeAt(track.id.length - 1)) % CHORD_PROGRESSIONS.length;
  const prog = CHORD_PROGRESSIONS[progIdx];
  const degree = prog[barIndex % prog.length];

  const rootSemi = scale[degree % scale.length];
  const thirdSemi = scale[(degree + 2) % scale.length] + (degree + 2 >= scale.length ? 12 : 0);
  const fifthSemi = scale[(degree + 4) % scale.length] + (degree + 4 >= scale.length ? 12 : 0);
  const seventhSemi = scale[(degree + 6) % scale.length] + (degree + 6 >= scale.length ? 12 : 0);

  const chordRoot = semiToHz(track.rootFreq, rootSemi);
  const chordThird = semiToHz(track.rootFreq, thirdSemi);
  const chordFifth = semiToHz(track.rootFreq, fifthSemi);
  const chordSeventh = semiToHz(track.rootFreq, seventhSemi);

  // Warm pad / Rhodes chord
  const padEnv = Math.sin(Math.min(1, beatPos * 2) * Math.PI * 0.5) * (0.65 + 0.35 * Math.cos(beatPos * Math.PI));
  let padL =
    0.18 * Math.sin(2 * Math.PI * chordRoot * t) +
    0.13 * Math.sin(2 * Math.PI * chordThird * t + 0.2) +
    0.12 * Math.sin(2 * Math.PI * chordFifth * t + 0.5) +
    0.09 * Math.sin(2 * Math.PI * chordSeventh * t + 0.8);
  let padR =
    0.18 * Math.sin(2 * Math.PI * (chordRoot * 1.0018) * t + 0.15) +
    0.13 * Math.sin(2 * Math.PI * (chordThird * 0.9985) * t + 0.4) +
    0.12 * Math.sin(2 * Math.PI * (chordFifth * 1.0012) * t + 0.7) +
    0.09 * Math.sin(2 * Math.PI * (chordSeventh * 0.999) * t + 1.0);
  padL *= padEnv;
  padR *= padEnv;

  // Bassline
  const bassHz = chordRoot * 0.5;
  const bassEnv = Math.exp(-beatPos * (track.synthStyle === 'electronic' || track.synthStyle === 'punjabi' ? 4.5 : 2.6));
  const bassWave =
    0.26 * Math.sin(2 * Math.PI * bassHz * t) +
    0.07 * Math.sin(2 * Math.PI * bassHz * 2 * t);
  const bass = bassWave * bassEnv;

  // Melodic motif (deterministic musical phrase)
  const melodyPattern = [0, 2, 4, 2, 5, 4, 2, 1];
  const melDeg = (degree + melodyPattern[stepIndex % melodyPattern.length]) % scale.length;
  const melHz = semiToHz(track.rootFreq * 2, scale[melDeg]);
  const melPlay = (stepIndex + barIndex) % 5 !== 4;
  const melEnv = melPlay ? Math.exp(-stepPos * 4.2) * (1 - Math.exp(-stepPos * 45)) : 0;
  let melody = 0;
  if (track.synthStyle === 'rock' || track.synthStyle === 'indie') {
    melody = (0.16 * Math.sin(2 * Math.PI * melHz * t) + 0.06 * Math.sin(4 * Math.PI * melHz * t)) * melEnv;
  } else if (track.synthStyle === 'classical' || track.synthStyle === 'instrumental') {
    melody = (0.2 * Math.sin(2 * Math.PI * melHz * t) + 0.05 * Math.sin(3 * Math.PI * melHz * t)) * melEnv;
  } else {
    melody = (0.18 * Math.sin(2 * Math.PI * melHz * t) + 0.04 * Math.sin(6 * Math.PI * melHz * t)) * melEnv;
  }

  // Gentle kick & rhythmic pulse for rhythmic genres
  let perc = 0;
  const hasDrums = !['classical', 'devotional', 'instrumental'].includes(track.synthStyle);
  if (hasDrums) {
    const kickTrigger = beatIndex % 2 === 0 || track.synthStyle === 'electronic' || track.synthStyle === 'punjabi';
    if (kickTrigger && beatPos < 0.18) {
      const kickFreq = 48 + 110 * Math.exp(-beatPos * 28);
      perc += 0.3 * Math.sin(2 * Math.PI * kickFreq * beatPos) * Math.exp(-beatPos * 18);
    }
    // Crisp soft off-beat shaker/hihat
    if (stepIndex % 2 === 1 && stepPos < 0.08) {
      const pseudoNoise = Math.sin(sampleIndex * 12.9898) * 43758.5453;
      const white = (pseudoNoise - Math.floor(pseudoNoise)) * 2 - 1;
      perc += 0.045 * white * Math.exp(-stepPos * 55);
    }
  } else if (track.synthStyle === 'devotional' || track.synthStyle === 'bollywood') {
    // Soft tanpura drone shimmer
    perc += 0.04 * Math.sin(2 * Math.PI * track.rootFreq * 1.5 * t);
  }

  // Smooth fade-in (1.5s) and fade-out (2.5s)
  const fadeIn = Math.min(1, t / 1.5);
  const remaining = (totalSamples - sampleIndex) / SAMPLE_RATE;
  const fadeOut = Math.min(1, Math.max(0, remaining / 2.5));
  const masterEnv = fadeIn * fadeOut;

  const left = Math.max(-0.92, Math.min(0.92, (padL + bass + melody * 0.85 + perc) * masterEnv));
  const right = Math.max(-0.92, Math.min(0.92, (padR + bass + melody * 1.05 + perc) * masterEnv));
  return [left, right];
}

export function serveTrackAudio(req: Request, res: Response) {
  const rawId = String(req.params.trackId || '').replace(/\.wav$/i, '');
  const track = getTrackById(rawId);

  if (!track) {
    res.status(404).json({ error: 'Audio track not found' });
    return;
  }

  const totalSamples = Math.floor(track.duration * SAMPLE_RATE);
  const dataBytes = totalSamples * BYTES_PER_SAMPLE;
  const totalBytes = WAV_HEADER_SIZE + dataBytes;

  let start = 0;
  let end = totalBytes - 1;
  let isRange = false;

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
    if (match) {
      start = parseInt(match[1], 10);
      end = match[2] ? parseInt(match[2], 10) : Math.min(totalBytes - 1, start + 262143);
      if (start >= totalBytes || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${totalBytes}`).end();
        return;
      }
      end = Math.min(end, totalBytes - 1);
      isRange = true;
    }
  } else {
    // Full request without Range: stream whole WAV cleanly
    end = totalBytes - 1;
  }

  const chunkLength = end - start + 1;
  const out = Buffer.alloc(chunkLength);
  let offset = 0;

  if (start < WAV_HEADER_SIZE) {
    const header = buildWavHeader(dataBytes);
    const headerEnd = Math.min(WAV_HEADER_SIZE - 1, end);
    const copyLen = headerEnd - start + 1;
    header.copy(out, 0, start, start + copyLen);
    offset += copyLen;
  }

  const pcmByteStart = Math.max(start, WAV_HEADER_SIZE) - WAV_HEADER_SIZE;
  const pcmByteEnd = end - WAV_HEADER_SIZE;

  if (pcmByteEnd >= pcmByteStart) {
    let curByte = pcmByteStart;
    // Align to sample boundary if needed
    while (curByte <= pcmByteEnd) {
      const sampleIdx = Math.floor(curByte / BYTES_PER_SAMPLE);
      const byteInSample = curByte % BYTES_PER_SAMPLE;
      const [l, r] = synthesizeSample(track, sampleIdx, totalSamples);
      const lInt = Math.round(l * 32767);
      const rInt = Math.round(r * 32767);
      const sampleBuf = Buffer.allocUnsafe(4);
      sampleBuf.writeInt16LE(lInt, 0);
      sampleBuf.writeInt16LE(rInt, 2);

      const copyCount = Math.min(4 - byteInSample, pcmByteEnd - curByte + 1);
      sampleBuf.copy(out, offset, byteInSample, byteInSample + copyCount);
      offset += copyCount;
      curByte += copyCount;
    }
  }

  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (isRange) {
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${totalBytes}`);
    res.setHeader('Content-Length', chunkLength);
  } else {
    res.status(200);
    res.setHeader('Content-Length', chunkLength);
  }

  res.send(out);
}
