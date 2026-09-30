/**
 * Converts a browser-recorded Blob (webm/opus, mp4, ogg) to base64 WAV
 * at 16 kHz 16-bit mono PCM — the format Bhashini Dhruva ASR expects.
 *
 * Mixing and resampling is done in JS (not ChannelMerger → OfflineAudioContext).
 * Connecting a ChannelMerger to a 1-channel OfflineAudioContext destination
 * often yields silence in Chrome, which Bhashini then "transcribes" as filler
 * words such as "you".
 */

const TARGET_SAMPLE_RATE = 16000;
const SILENCE_RMS_THRESHOLD = 0.002;

export class SilentRecordingError extends Error {
  constructor() {
    super("No speech detected. Please speak closer to the microphone and try again.");
    this.name = "SilentRecordingError";
  }
}

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export async function convertWebmToWav(audioBlob: Blob): Promise<string> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  if (arrayBuffer.byteLength < 500) {
    throw new SilentRecordingError();
  }

  const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await decodeCtx.close();
  }

  const pcm = mixToMonoAndResample(decoded, TARGET_SAMPLE_RATE);
  const rms = rootMeanSquare(pcm);
  if (rms < SILENCE_RMS_THRESHOLD) {
    throw new SilentRecordingError();
  }

  const wavBlob = encodeWavPcm16(pcm, TARGET_SAMPLE_RATE);
  return blobToBase64(wavBlob);
}

function mixToMonoAndResample(buffer: AudioBuffer, targetRate: number): Float32Array {
  const srcRate = buffer.sampleRate || targetRate;
  const length = buffer.length;
  const channels = Math.max(1, buffer.numberOfChannels);
  const channelData: Float32Array[] = [];
  for (let c = 0; c < channels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  const targetLength = Math.max(1, Math.round((length * targetRate) / srcRate));
  const out = new Float32Array(targetLength);
  const ratio = srcRate / targetRate;

  for (let i = 0; i < targetLength; i++) {
    const srcPos = i * ratio;
    const i0 = Math.min(Math.floor(srcPos), length - 1);
    const i1 = Math.min(i0 + 1, length - 1);
    const frac = srcPos - i0;
    let s0 = 0;
    let s1 = 0;
    for (let c = 0; c < channels; c++) {
      s0 += channelData[c][i0] || 0;
      s1 += channelData[c][i1] || 0;
    }
    s0 /= channels;
    s1 /= channels;
    out[i] = s0 + (s1 - s0) * frac;
  }
  return out;
}

function rootMeanSquare(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

function encodeWavPcm16(samples: Float32Array, sampleRate: number): Blob {
  const dataSize = samples.length * 2;
  const bufferArray = new ArrayBuffer(44 + dataSize);
  const view = new DataView(bufferArray);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
    view.setInt16(offset, Math.max(-32768, Math.min(32767, int16)), true);
    offset += 2;
  }

  return new Blob([bufferArray], { type: "audio/wav" });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result?.split(",")[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error("Failed to encode audio to base64"));
      }
    };
    reader.onerror = () => reject(new Error("FileReader error during audio conversion"));
    reader.readAsDataURL(blob);
  });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
