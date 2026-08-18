import { useCallback, useRef, useState } from 'react';
import apiClient from '@/services/apiClient';

const MAX_CHUNK_MS = 30_000;

interface UseAudioCaptureReturn {
  isCapturing: boolean;
  startCapture: (roomId: number) => Promise<void>;
  stopCapture: () => void;
}

export function useAudioCapture(): UseAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const chunkIndexRef = useRef(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async (roomId: number) => {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
    chunksRef.current = [];
    const index = chunkIndexRef.current++;

    const form = new FormData();
    form.append('audio', blob, `chunk-${index}.webm`);
    form.append('chunkIndex', String(index));

    try {
      await apiClient.post(`/meetings/${roomId}/transcript`, form);
    } catch (e) {
      console.warn('[AudioCapture] 청크 업로드 실패:', e);
    }
  }, []);

  const startCapture = useCallback(async (roomId: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      await ctx.audioWorklet.addModule('/audio-processor.js');
      const source = ctx.createMediaStreamSource(stream);
      const vad = new AudioWorkletNode(ctx, 'vad-processor');
      source.connect(vad);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => flush(roomId);

      vad.port.onmessage = (e) => {
        if (e.data.type === 'speech_start') {
          if (recorder.state !== 'recording') {
            chunksRef.current = [];
            recorder.start(100);
            maxTimerRef.current = setTimeout(() => {
              if (recorder.state === 'recording') recorder.stop();
            }, MAX_CHUNK_MS);
          }
        } else if (e.data.type === 'speech_end') {
          if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
          if (recorder.state === 'recording') recorder.stop();
        }
      };

      setIsCapturing(true);
    } catch (e) {
      console.error('[AudioCapture] 시작 실패:', e);
    }
  }, [flush]);

  const stopCapture = useCallback(() => {
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
    setIsCapturing(false);
  }, []);

  return { isCapturing, startCapture, stopCapture };
}
