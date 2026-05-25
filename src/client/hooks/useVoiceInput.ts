import { useCallback, useEffect, useRef, useState } from "react";
import { toastError } from "../utils/toast";

interface UseVoiceInputOptions {
  language?: string;
  onTranscribed: (text: string) => void;
}

export function useVoiceInput({
  language,
  onTranscribed
}: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toastError("Microphone unavailable", "Not supported in this browser");
      return;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        cleanup();
        setIsRecording(false);
        setIsTranscribing(true);
        try {
          const qs = language
            ? `?language=${encodeURIComponent(language)}`
            : "";
          const res = await fetch(`/api/transcribe${qs}`, {
            method: "POST",
            headers: { "content-type": blob.type },
            body: blob
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(
              body.error ?? `Transcription failed (${res.status})`
            );
          }
          const { text } = (await res.json()) as { text: string };
          if (text.trim()) onTranscribed(text.trim());
        } catch (e) {
          toastError(
            "Transcription failed",
            e instanceof Error ? e.message : undefined
          );
        } finally {
          setIsTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (e) {
      cleanup();
      toastError(
        e instanceof Error && e.name === "NotAllowedError"
          ? "Microphone permission denied"
          : "Could not start recording"
      );
    }
  }, [language, onTranscribed, cleanup]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      recorderRef.current = null;
      chunksRef.current = [];
    };
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  return { isRecording, isTranscribing, start, stop };
}
