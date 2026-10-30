// Audio utilities: Web Speech API (TTS) & Web Audio API Visualizer

// Korean Text-to-Speech (TTS) for elderly users
export const speakText = (text: string, rate = 0.85): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = rate; // slightly slower for senior friendliness
    utterance.pitch = 1.0;

    // Try to find a good Korean voice
    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// Microphone & Waveform Visualizer
export class AudioRecorderService {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private static activeService: AudioRecorderService | null = null;

  static getActiveService(): AudioRecorderService | null {
    return AudioRecorderService.activeService;
  }

  static getActiveStream(): MediaStream | null {
    return AudioRecorderService.activeService?.mediaStream ?? null;
  }

  static getActiveAnalyser(): AnalyserNode | null {
    return AudioRecorderService.activeService?.analyser ?? null;
  }

  getStream(): MediaStream | null {
    return this.mediaStream;
  }

  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  async startRecording(onAudioData?: (dataArray: Uint8Array) => void): Promise<boolean> {
    try {
      this.audioChunks = [];
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      AudioRecorderService.activeService = this;

      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);

      // Animation loop for analyser data
      if (onAudioData && this.analyser) {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const update = () => {
          if (this.analyser && this.mediaStream?.active) {
            this.analyser.getByteFrequencyData(dataArray);
            onAudioData(dataArray);
            requestAnimationFrame(update);
          }
        };
        update();
      }

      return true;
    } catch (err) {
      console.warn('Microphone permission denied or not available, fallback to simulation mode.', err);
      return false;
    }
  }

  stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          this.cleanup();
          resolve(audioUrl);
        };
        this.mediaRecorder.stop();
      } else {
        this.cleanup();
        resolve('');
      }
    });
  }

  private cleanup() {
    if (AudioRecorderService.activeService === this) {
      AudioRecorderService.activeService = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.mediaRecorder = null;
  }
}
