/**
 * Converts a browser-recorded Blob (webm/opus) to a base64-encoded WAV
 * at 16 kHz mono — the format expected by Bhashini ASR.
 */
export async function convertWebmToWav(webmBlob: Blob): Promise<string> {
  const arrayBuffer = await webmBlob.arrayBuffer();

  // Decode using the browser's native rate first (avoid sampleRate mismatch errors)
  const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  await decodeCtx.close();

  // Resample to 16 kHz mono offline
  const TARGET_SAMPLE_RATE = 16000;
  const offlineCtx = new OfflineAudioContext(
    1, // mono
    Math.ceil(decoded.duration * TARGET_SAMPLE_RATE),
    TARGET_SAMPLE_RATE
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;

  // Mix down to mono by connecting to a channel merger
  const splitter = offlineCtx.createChannelSplitter(decoded.numberOfChannels);
  const merger = offlineCtx.createChannelMerger(1);
  source.connect(splitter);
  for (let i = 0; i < decoded.numberOfChannels; i++) {
    splitter.connect(merger, i, 0);
  }
  merger.connect(offlineCtx.destination);
  source.start(0);

  const resampled = await offlineCtx.startRendering();

  // Encode to WAV
  const wavBlob = audioBufferToWavBlob(resampled);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error("Failed to encode audio to base64"));
      }
    };
    reader.onerror = () => reject(new Error("FileReader error during audio conversion"));
    reader.readAsDataURL(wavBlob);
  });
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels: Float32Array[] = [];
  let offset = 44;

  // WAV Header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, buffer.length * numOfChan * 2, true);

  // Audio data
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let pos = 0; pos < buffer.length; pos++) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample | 0, true);
      offset += 2;
    }
  }

  return new Blob([bufferArray], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
