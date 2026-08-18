class VadProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._isSpeaking = false;
    this._silenceFrames = 0;
    this._SILENCE_THRESHOLD = 0.012;
    this._SILENCE_FRAMES_LIMIT = 80; // ~1.7s at 48kHz/128 samples
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0];
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    const rms = Math.sqrt(sum / samples.length);

    if (rms > this._SILENCE_THRESHOLD) {
      this._silenceFrames = 0;
      if (!this._isSpeaking) {
        this._isSpeaking = true;
        this.port.postMessage({ type: 'speech_start' });
      }
    } else if (this._isSpeaking) {
      this._silenceFrames++;
      if (this._silenceFrames >= this._SILENCE_FRAMES_LIMIT) {
        this._isSpeaking = false;
        this._silenceFrames = 0;
        this.port.postMessage({ type: 'speech_end' });
      }
    }

    return true;
  }
}

registerProcessor('vad-processor', VadProcessor);
