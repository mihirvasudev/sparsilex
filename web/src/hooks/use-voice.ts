"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ── Speech Recognition (STT) ────────────────────────

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

// ── Speech Synthesis (TTS) ───────────────────────────

function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  // Prefer a natural-sounding English voice
  const preferred = ["Samantha", "Karen", "Daniel", "Google US English", "Microsoft Aria"];
  for (const name of preferred) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

// ── Hook ─────────────────────────────────────────────

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const isSupported = typeof window !== "undefined" && !!getSpeechRecognition();
  const isTTSSupported = typeof window !== "undefined" && !!window.speechSynthesis;

  // ── Audio level monitoring (for waveform) ──────────

  const startAudioLevelMonitor = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(1, avg / 128));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Mic permission denied — no waveform, but recognition may still work
      setAudioLevel(0);
    }
  }, []);

  const stopAudioLevelMonitor = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // ── Speech Recognition ─────────────────────────────

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
      setFinalTranscript("");
    };

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        setFinalTranscript(final);
        setInterimTranscript("");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      stopAudioLevelMonitor();
    };

    recognition.onend = () => {
      setIsListening(false);
      stopAudioLevelMonitor();
    };

    recognitionRef.current = recognition;
    recognition.start();
    startAudioLevelMonitor();
  }, [startAudioLevelMonitor, stopAudioLevelMonitor]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    stopAudioLevelMonitor();
  }, [stopAudioLevelMonitor]);

  // ── Speech Synthesis (TTS) ─────────────────────────

  const speak = useCallback(
    (text: string) => {
      if (!isTTSSupported || !speechEnabled || !text.trim()) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getPreferredVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [speechEnabled, isTTSSupported]
  );

  const cancelSpeech = useCallback(() => {
    if (isTTSSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isTTSSupported]);

  // ── Load voices (Chrome loads asynchronously) ──────

  useEffect(() => {
    if (isTTSSupported) {
      window.speechSynthesis.getVoices(); // Trigger voice list load
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, [isTTSSupported]);

  // ── Cleanup ────────────────────────────────────────

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopAudioLevelMonitor();
      if (isTTSSupported) window.speechSynthesis.cancel();
    };
  }, [stopAudioLevelMonitor, isTTSSupported]);

  // ── Clear final transcript after it's been consumed ─

  const clearFinalTranscript = useCallback(() => setFinalTranscript(""), []);

  return {
    // STT
    isListening,
    interimTranscript,
    finalTranscript,
    clearFinalTranscript,
    startListening,
    stopListening,
    isSupported,
    audioLevel,
    // TTS
    isSpeaking,
    speak,
    cancelSpeech,
    speechEnabled,
    setSpeechEnabled,
    isTTSSupported,
  };
}
