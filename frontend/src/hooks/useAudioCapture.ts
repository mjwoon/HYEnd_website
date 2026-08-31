import { useCallback, useRef, useState } from 'react';
import apiClient from '@/services/apiClient';

const MAX_CHUNK_MS = 30_000;
const POLL_MS = 100;
const SILENCE_THRESHOLD = 2;     // RMS in time-domain byte scale (0–128), ~0.016 normalised
const SILENCE_LIMIT = 20;        // 20 × 100 ms = 2 s of silence

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  startCapture: (roomId: number) => Promise<void>;
  stopCapture: () => void;
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);

  const audioCtxRef   = useRef<AudioContext | null>(null);
  const recorderRef   = useRef<MediaRecorder | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const chunksRef     = useRef<BlobPart[]>([]);
  const chunkIndexRef = useRef(0);
  const maxTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(async (roomId: number) => {
    if (chunksRef.current.length === 0) return;
    const mimeType = recorderRef.current?.mimeType ?? 'audio/webm';
    const blob  = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    if (blob.size < 500) return;

    const index = chunkIndexRef.current++;
    const form  = new FormData();
    form.append('audio', blob, `chunk-${index}.webm`);
    form.append('chunkIndex', String(index));

    try {
      await apiClient.post(`/meetings/${roomId}/transcript`, form);
      console.log('[AudioCapture] 청크 업로드 완료 index=', index, 'size=', blob.size);
    } catch (e) {
      console.warn('[AudioCapture] 청크 업로드 실패:', e);
    }
  }, []);

  const startCapture = useCallback(async (roomId: number) => {
    // 이전 세션 정리 (중복 호출 방지)
    if (pollTimerRef.current)  { clearInterval(pollTimerRef.current);   pollTimerRef.current  = null; }
    if (maxTimerRef.current)   { clearTimeout(maxTimerRef.current);     maxTimerRef.current   = null; }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    audioCtxRef.current = null;
    streamRef.current   = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => flush(roomId);

      const timeData   = new Uint8Array(analyser.fftSize);
      let isSpeaking   = false;
      let silenceCount = 0;
      let logTick      = 0;

      pollTimerRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] ?? 128) - 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / timeData.length);

        if (++logTick % 20 === 0) console.log('[AudioCapture] rms:', rms.toFixed(2));

        if (rms > SILENCE_THRESHOLD) {
          silenceCount = 0;
          if (!isSpeaking) {
            isSpeaking = true;
            console.log('[AudioCapture] 음성 감지 → 녹음 시작');
            if (recorder.state !== 'recording') {
              chunksRef.current = [];
              recorder.start(100);
              maxTimerRef.current = setTimeout(() => {
                if (recorder.state === 'recording') recorder.stop();
              }, MAX_CHUNK_MS);
            }
          }
        } else if (isSpeaking) {
          silenceCount++;
          if (silenceCount >= SILENCE_LIMIT) {
            isSpeaking   = false;
            silenceCount = 0;
            if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
            if (recorder.state === 'recording') recorder.stop();
          }
        }
      }, POLL_MS);

      setIsCapturing(true);
      console.log('[AudioCapture] 시작 완료 – 음성 감지 중');
    } catch (e) {
      console.error('[AudioCapture] 시작 실패:', e);
    }
  }, [flush]);

  const stopCapture = useCallback(() => {
    if (pollTimerRef.current)  { clearInterval(pollTimerRef.current);   pollTimerRef.current  = null; }
    if (maxTimerRef.current)   { clearTimeout(maxTimerRef.current);     maxTimerRef.current   = null; }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current  = null;
    audioCtxRef.current  = null;
    streamRef.current    = null;
    setIsCapturing(false);
  }, []);

  return { isCapturing, startCapture, stopCapture };
}
