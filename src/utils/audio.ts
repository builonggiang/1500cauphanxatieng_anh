/**
 * Audio synthesis (TTS) & Web Speech Recognition utility
 */

export interface SpeechVoiceOption {
  voice: SpeechSynthesisVoice;
  label: string;
}

export function getEnglishVoices(): SpeechVoiceOption[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));

  return enVoices.map((v) => ({
    voice: v,
    label: `${v.name} (${v.lang})`,
  }));
}

export function playSpeech(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    voiceName?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): { stop: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    options?.onError?.(new Error('Trình duyệt không hỗ trợ Web SpeechSynthesis'));
    return { stop: () => {} };
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = options?.rate ?? 0.95; // slightly natural learner pace
  utterance.pitch = options?.pitch ?? 1.0;

  const voices = window.speechSynthesis.getVoices();
  if (options?.voiceName) {
    const selected = voices.find((v) => v.name === options.voiceName);
    if (selected) utterance.voice = selected;
  } else {
    // Prefer high quality US or UK native voices
    const preferred =
      voices.find((v) => v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Ava'))) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    if (e.error !== 'canceled') {
      options?.onError?.(e);
    }
    options?.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => {
      window.speechSynthesis.cancel();
      options?.onEnd?.();
    },
  };
}

export function playNativeSpeech(text: string, rate: number = 0.95): { stop: () => void } {
  return playSpeech(text, { rate });
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Web Speech Recognition Hook / Helper
 */
export interface RecognitionController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function createSpeechRecognizer(callbacks: {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart?: () => void;
}): RecognitionController | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    callbacks.onStart?.();
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onResult(finalTranscript.trim(), true);
    } else if (interimTranscript) {
      callbacks.onResult(interimTranscript.trim(), false);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    callbacks.onError(event.error);
  };

  recognition.onend = () => {
    callbacks.onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (err: any) {
        console.warn('Recognition already started or error:', err);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {}
    },
    abort: () => {
      try {
        recognition.abort();
      } catch (err) {}
    },
  };
}
